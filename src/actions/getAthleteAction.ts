"use server";

import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import { catchErrors } from "../utlis/ErrorWrapper";
import { getAuthSession } from "../utlis/helper";
import { ActionResponse } from "./dashboardAction";

export const getAthleteDataAction = catchErrors(
  async (
    _prevState: ActionResponse,
    userToken: string,
  ): Promise<ActionResponse> => {
    if (!userToken) {
      return {
        success: false,
        error: true,
        message: "User token is required to fetch data.",
        data: null,
      };
    }

    // 1. Check Redis cache first using the userToken as the sessionId identifier
    const cacheKey = `auth_session:${userToken}`;
    const cachedUser = await setRedis.get(cacheKey);

    let sessionData = null;
    if (cachedUser) {
      sessionData =
        typeof cachedUser === "string" ? JSON.parse(cachedUser) : cachedUser;
    }

    // 2. If session exists in cache and has athleteData, return it immediately
    if (sessionData?.athleteData && sessionData.isOnboard) {
      return {
        success: true,
        error: false,
        message: "Athlete data retrieved from cache",
        data: sessionData, // Matches frontend ProfileData type
      };
    }

    // 3. Fallback: If not in cache, resolve session via the database helper
    const userData = await getAuthSession({ sessionId: userToken });

    if (!userData?.data?.userId) {
      return {
        success: false,
        error: true,
        message: "Session invalid or expired.",
        data: null,
      };
    }

    // 4. Fetch the specific athlete profile record from Prisma WITH relations
    const athleteProfile = await prisma.athleteProfile.findUnique({
      where: { userId: userData.data.userId },
      include: {
        raceResults: true, // ← ADDED THIS
        achievements: true, // ← ADDED THIS
      },
    });

    if (!athleteProfile) {
      return {
        success: false,
        error: true,
        message: "Athlete profile not found. Please complete onboarding.",
        data: null,
      };
    }

    // 5. Reconstruct the full session object to match the frontend ProfileData interface
    const fullProfileData = {
      ...userData.data,
      athleteData: athleteProfile,
    };

    // 6. Save this fully populated object back into the cache so we don't hit the DB next time
    await setRedis.set(cacheKey, JSON.stringify(fullProfileData), {
      ex: 60 * 60 * 24 * 7, // 7 days
    });

    // 7. Return the database record
    return {
      success: true,
      error: false,
      message: "Athlete data retrieved from database",
      data: fullProfileData,
    };
  },
);
