"use server";

import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import {
  addAthleteToPool,
  updateAthleteInPool,
} from "../service/getData.service";
import {
  AchievementInput,
  ActionResponse,
  setProfilePayload,
} from "../type/ProfileType";
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

export const addAchievementAction = catchErrors(
  async (
    _prevState: ActionResponse,
    payload: AchievementInput,
  ): Promise<ActionResponse> => {
    // 1. Validate Session
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

    const userId = sessionData.userId;

    // 2. Fetch the existing Athlete Profile & Team Status
    const userWithProfileAndTeams = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        athleteProfile: { include: { achievements: true } },
        ownedTeams: { select: { ownerId: true } },
        teamMemberships: { select: { team: { select: { ownerId: true } } } },
      },
    });

    if (!userWithProfileAndTeams || !userWithProfileAndTeams.athleteProfile) {
      return {
        success: false,
        error: true,
        message: "Athlete profile not found. Please complete onboarding.",
        data: null,
      };
    }

    const profile = userWithProfileAndTeams.athleteProfile;

    // 3. Save to Database
    const newAchievement = await prisma.achievement.create({
      data: {
        profileId: profile.id,
        title: payload.title,
        description: payload.description || null,
      },
    });

    // 4. Update the Session Cache
    if (sessionData.athleteData) {
      const updatedAchievements = [
        ...(sessionData.athleteData.achievements || []),
        newAchievement,
      ];

      const updatedSessionData = {
        ...sessionData,
        athleteData: {
          ...sessionData.athleteData,
          achievements: updatedAchievements,
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
    }

    // 5. Update the Global Athlete Pool
    const allAchievements = [...profile.achievements, newAchievement];
    const formattedAchievements = allAchievements.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description ?? undefined, // <-- Converts null to undefined
    }));
    await updateAthleteInPool(userId, { achievements: formattedAchievements! });

    // 6. Bust Team Caches
    const cachesToBust: string[] = [];

    if (userWithProfileAndTeams.ownedTeams.length > 0) {
      cachesToBust.push(`myteam:${userId}`);
    }

    if (userWithProfileAndTeams.teamMemberships.length > 0) {
      const teamOwnerId =
        userWithProfileAndTeams.teamMemberships[0].team.ownerId;
      cachesToBust.push(`myteam:${teamOwnerId}`);
      cachesToBust.push(`myteam:${userId}`);
    }

    if (cachesToBust.length > 0) {
      const uniqueCaches = Array.from(new Set(cachesToBust));
      await Promise.all(uniqueCaches.map((key) => setRedis.del(key)));
    }

    return {
      success: true,
      error: false,
      message: "Achievement added successfully",
      data: newAchievement,
    };
  },
);
