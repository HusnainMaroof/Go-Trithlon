"use server";

import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import { setProfilePayload } from "../type/dashboardtype";
import { catchErrors } from "../utlis/ErrorWrapper";

export type ActionResponse = {
  success: boolean;
  error: boolean;
  message?: any;
  data: any;
};

export const setprofileAction = catchErrors(
  async (
    prevState: ActionResponse,
    payload: setProfilePayload,
  ): Promise<ActionResponse> => {
    const getUser = await getCurrentUser();
    const sessionId = getUser.sessionId;

    const cacheKey = `auth_session:${sessionId}`;

    const cachedUser = await setRedis.get(cacheKey);

    const sessionData =
      typeof cachedUser === "string" ? JSON.parse(cachedUser) : cachedUser;

    if (!sessionData || !sessionData.userId) {
      return {
        success: false, // ✅ this was wrong before
        error: true,
        message: "no session data ",
        data: {},
      };
    }

    console.log("from setprofile action", payload);

    const createdProfile = await prisma.athleteProfile.create({
      data: {
        userId: sessionData.userId,
        displayName: payload.displayName ?? null,
        locationCity: payload.locationCity ?? null,
        discipline: payload.discipline,
        experienceLevel: payload.experienceLevel,
        competitionLevel: payload.competitionLevel,
        trainingDaysPerWeek: payload.trainingDaysPerWeek,
        cycleTime10km: payload.cycleTime10km ?? null,
        runTime5km: payload.runTime5km ?? null,
        swimTime100m: payload.swimTime100m ?? null,
      },
    });

    // ✅ Update user properly (not updateMany)
    await prisma.user.update({
      where: { id: sessionData.userId },
      data: { is_Onboard: true },
    });

    // ✅ Update session safely
    const updatedSessionData = {
      ...sessionData,
      isOnboard: true,
      athleteData: createdProfile,
    };

    const ttl = await setRedis.ttl(cacheKey);

    if (ttl > 0) {
      await setRedis.set(cacheKey, JSON.stringify(updatedSessionData), {
        ex: ttl,
      });
    } else {
      await setRedis.set(cacheKey, JSON.stringify(updatedSessionData));
    }

    return {
      success: true, // ✅ this was wrong before
      error: false,
      message: "Profile updated successfully",
      data: updatedSessionData,
    };
  },
);
