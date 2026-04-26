"use server";

import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import { addAthleteToPool } from "../service/getData.service";
import { setProfilePayload } from "../type/ProfileType";
import { catchErrors } from "../utlis/ErrorWrapper";

export type ActionResponse<T = any> = {
  success: boolean;
  error: boolean;
  message?: string;
  data: T | null;
};

export const setprofileAction = catchErrors(
  async (
    prevState: ActionResponse,
    payload: setProfilePayload,
  ): Promise<ActionResponse> => {
    const getUser = await getCurrentUser();
    const sessionId = getUser.authsuccess.data.sessionId;

    const cacheKey = `auth_session:${sessionId}`;

    const cachedUser = await setRedis.get(cacheKey);

    const sessionData =
      typeof cachedUser === "string" ? JSON.parse(cachedUser) : cachedUser;

    if (!sessionData?.userId) {
      return {
        success: false,
        error: true,
        message: "Session not found",
        data: null,
      };
    }

    // ── 1. Create athlete profile ────────────────────────────────────────────
    const createdProfile = await prisma.athleteProfile.create({
      data: {
        userId: sessionData.userId,
        displayName: payload.displayName ?? null,
        locationCity: payload.locationCity ?? null,
        disciplines: payload.disciplines,
        experienceLevel: payload.experienceLevel,
        // future fields — null for now
        competitionLevel: payload.competitionLevel ?? null,
        trainingDaysPerWeek: payload.trainingDaysPerWeek ?? null,
      },
    });

    // ── 2. Save race results ─────────────────────────────────────────────────
    if (payload.raceResults.length > 0) {
      await prisma.raceResult.createMany({
        data: payload.raceResults.map((r) => ({
          profileId: createdProfile.id,
          discipline: r.discipline,
          distance: r.distance,
          timeSeconds: r.timeSeconds,
        })),
      });
    }

    // ── 3. Save achievements ─────────────────────────────────────────────────
    if (payload.achievements.length > 0) {
      await prisma.achievement.createMany({
        data: payload.achievements.map((a) => ({
          profileId: createdProfile.id,
          title: a.title,
          description: a.description ?? null,
        })),
      });
    }

    // ── 4. Mark user as onboarded ────────────────────────────────────────────
    await prisma.user.update({
      where: { id: sessionData.userId },
      data: { is_Onboard: true },
    });

    // ── 5. Update Redis session ──────────────────────────────────────────────
 const updatedSessionData = {
  ...sessionData,
  isOnboard: true,
  athleteData: {
    id: createdProfile.id,
    userId: createdProfile.userId,
    displayName: createdProfile.displayName,
    disciplines: createdProfile.disciplines,
    experienceLevel: createdProfile.experienceLevel,
    trainingDaysPerWeek: createdProfile.trainingDaysPerWeek,
    competitionLevel: createdProfile.competitionLevel,
    locationCity: createdProfile.locationCity,
    createdAt: createdProfile.createdAt,
    updatedAt: createdProfile.updatedAt,
    raceResults: payload.raceResults,    // ← directly from payload
    achievements: payload.achievements,  // ← directly from payload
  },
};

    const ttl = await setRedis.ttl(cacheKey);

    if (ttl > 0) {
      await setRedis.set(cacheKey, JSON.stringify(updatedSessionData), {
        ex: ttl,
      });
    } else {
      await setRedis.set(cacheKey, JSON.stringify(updatedSessionData));
    }

    // ── 6. Add to athlete pool ───────────────────────────────────────────────
    await addAthleteToPool(sessionData.userId, createdProfile, {
      userToken: sessionData.userToken,
      email: sessionData.email,
      name: sessionData.displayName,
      inTeam: false,
      profileImage: sessionData.profileImage,
    });

    return {
      success: true,
      error: false,
      message: "Profile created successfully",
      data: updatedSessionData,
    };
  },
);
