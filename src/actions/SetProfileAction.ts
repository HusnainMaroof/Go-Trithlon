"use server";

import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import { addAthleteToPool } from "../service/getData.service";
import { ActionResponse, setProfilePayload } from "../type/ProfileType";
import { catchErrors } from "../utlis/ErrorWrapper";

// Default session TTL: 7 days (matches your auth flow)
const SESSION_DEFAULT_TTL = 60 * 60 * 24 * 7;

export const setprofileAction = catchErrors(
  async (
    _prevState: ActionResponse,
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

    const createdProfile = await prisma.athleteProfile.create({
      data: {
        userId: sessionData.userId,
        displayName: payload.displayName ?? null,
        locationCity: payload.locationCity ?? null,
        disciplines: payload.disciplines,
        experienceLevel: payload.experienceLevel,
        competitionLevel: payload.competitionLevel ?? null,
        trainingDaysPerWeek: payload.trainingDaysPerWeek ?? null,
      },
    });

    await Promise.all([
      payload.raceResults.length > 0
        ? prisma.raceResult.createMany({
            data: payload.raceResults.map((r) => ({
              profileId: createdProfile.id,
              discipline: r.discipline,
              distance: r.distance,
              timeSeconds: r.timeSeconds,
            })),
          })
        : Promise.resolve(),

      payload.achievements.length > 0
        ? prisma.achievement.createMany({
            data: payload.achievements.map((a) => ({
              profileId: createdProfile.id,
              title: a.title,
              description: a.description ?? null,
            })),
          })
        : Promise.resolve(),

      prisma.user.update({
        where: { id: sessionData.userId },
        data: { is_Onboard: true },
      }),
    ]);

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
        raceResults: payload.raceResults,
        achievements: payload.achievements,
      },
    };

    const ttl = await setRedis.ttl(cacheKey);

    let newtll = ttl > 0 ? ttl : ttl === -1 ? undefined : SESSION_DEFAULT_TTL;

    await setRedis.set(cacheKey, JSON.stringify(updatedSessionData), {
      ex: newtll!,
    });

    await addAthleteToPool(
      sessionData.userId,
      {
        ...createdProfile,
        raceResults: payload.raceResults,
        achievements: payload.achievements,
      },
      {
        userToken: sessionData.userToken,
        email: sessionData.email,
        name: sessionData.displayName,
        inTeam: false,
        profileImage: sessionData.profileImage,
      },
    );

    return {
      success: true,
      error: false,
      message: "Profile created successfully",
      data: updatedSessionData,
    };
  },
);
