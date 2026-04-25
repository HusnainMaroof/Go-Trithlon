"use server";

import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import { addAthleteToPool } from "../service/getData.service";
import {
  claimSlotService,
  createTeamService,
  deleteTeamService,
  getTeamService,
  removeFromTeamService,
} from "../service/team.service";
import {
  acceptInvitePayload,
  sendInvitesPayload,
  setProfilePayload,
  TeamActionPayload,
} from "../type/dashboardtype";
import { catchErrors } from "../utlis/ErrorWrapper";
import { getAuthSession } from "../utlis/helper";

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

    const createdProfile = await prisma.athleteProfile.create({
      data: {
        userId: sessionData.userId,
        displayName: payload.displayName ?? null,
        locationCity: payload.locationCity ?? null,

        // IMPORTANT: normalize field name consistently
        disciplines: payload.disciplines, // must always be array of enum

        experienceLevel: payload.experienceLevel,
        competitionLevel: payload.competitionLevel,
        trainingDaysPerWeek: payload.trainingDaysPerWeek,
        cycleTime10km: payload.cycleTime10km ?? null,
        runTime5km: payload.runTime5km ?? null,
        swimTime100m: payload.swimTime100m ?? null,
      },
    });

    await prisma.user.update({
      where: { id: sessionData.userId },
      data: { is_Onboard: true },
    });

    // 🔥 IMPORTANT: normalize session shape (THIS FIXES YOUR CLAIM SLOT PROBLEMS)
    const updatedSessionData = {
      ...sessionData,
      isOnboard: true,

      athleteData: {
        id: createdProfile.id,
        userId: createdProfile.userId,
        displayName: createdProfile.displayName,
        disciplines: createdProfile.disciplines, // ALWAYS THIS NAME
        swimTime100m: createdProfile.swimTime100m,
        cycleTime10km: createdProfile.cycleTime10km,
        runTime5km: createdProfile.runTime5km,
        experienceLevel: createdProfile.experienceLevel,
        trainingDaysPerWeek: createdProfile.trainingDaysPerWeek,
        competitionLevel: createdProfile.competitionLevel,
        locationCity: createdProfile.locationCity,
        createdAt: createdProfile.createdAt,
        updatedAt: createdProfile.updatedAt,
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


// In setprofileAction, after prisma.athleteProfile.create succeeds
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

export const teamAction = catchErrors(
  async (
    _prevState: ActionResponse,
    payload: TeamActionPayload,
  ): Promise<ActionResponse> => {
    if (!payload?.service) {
      return {
        success: false,
        error: true,
        message: "No service specified.",
        data: null,
      };
    }

    const getUser = await getCurrentUser();
    const sessionId = getUser.authsuccess.data.sessionId;

    const userData = await getAuthSession({ sessionId });

    if (!userData?.data) {
      return {
        success: false,
        error: true,
        message: "No session data",
        data: null,
      };
    }

    const userId = userData.data.userId;

    // console.log("payloafkakjdjnvojd", userData?.data?.athleteData);

    switch (payload.service) {
      case "GET_TEAM":
        return getTeamService(userId);

      case "CREATE_TEAM":
        return createTeamService(userId, payload.teamName); 

      case "CLAIM_SLOT":
        return claimSlotService(
          userId,
          payload.teamId,
          payload.role,
          userData?.data?.athleteData,
        );

      case "REMOVE_FROM_TEAM":
        return removeFromTeamService(userId, payload.memberId, payload.teamId);
      case "DELETE_TEAM": // Handle deletion
        return await deleteTeamService(userId, payload.teamId);
      default:
        return {
          success: false,
          error: true,
          message: "Unknown service.",
          data: null,
        };
    }
  },
);






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
        data: sessionData,
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

    // 4. Fetch the specific athlete profile record from Prisma
    const athleteProfile = await prisma.athleteProfile.findUnique({
      where: { userId: userData.data.userId },
    });

    if (!athleteProfile) {
      return {
        success: false,
        error: true,
        message: "Athlete profile not found. Please complete onboarding.",
        data: null,
      };
    }

    // 5. Return the database record
    return {
      success: true,
      error: false,
      message: "Athlete data retrieved from database",
      data: athleteProfile,
    };
  },
);



export const getAllAthlete = catchErrors(async (): Promise<ActionResponse> => {
  // Authenticate — marketplace needs user context for invite + team status
  const getUser = await getCurrentUser();
  const sessionId = getUser.authsuccess.data.sessionId;
  const userData = await getAuthSession({ sessionId });
  const userId = userData?.data?.userId ?? null;

  // Round-trip 1: athlete index + sent invites + team — all parallel
  const [userIds, cachedSent, cachedTeam] = await Promise.all([
    setRedis.lrange("athletes:index", 0, 99),
    userId ? setRedis.get(`invites:sent:${userId}`) : Promise.resolve(null),
    userId ? setRedis.get(`myteam:${userId}`) : Promise.resolve(null),
  ]);

  const parse = <T>(v: unknown): T | null => {
    if (!v) return null;
    return (typeof v === "string" ? JSON.parse(v) : v) as T;
  };

  let sentInvites: any[] = parse<any[]>(cachedSent) ?? [];
  let team: any = parse<any>(cachedTeam);

  // DB fallbacks — only for what's missing, fired in parallel
  const fallbacks: Promise<void>[] = [];

  if (!cachedSent && userId) {
    fallbacks.push(
      prisma.teamInvite
        .findMany({
          where: { fromUserId: userId, status: "PENDING" },
          select: { toUserId: true, role: true, id: true },
        })
        .then(async (result) => {
          sentInvites = result;
          await setRedis.set(
            `invites:sent:${userId}`,
            JSON.stringify(result),
            { ex: 60 * 5 },
          );
        }),
    );
  }

  if (!cachedTeam && userId) {
    fallbacks.push(
      prisma.myTeam
        .findFirst({
          where: { ownerId: userId },
          include: {
            members: { select: { role: true, userId: true } },
          },
        })
        .then(async (result) => {
          team = result ?? null;
          if (result) {
            await setRedis.set(
              `myteam:${userId}`,
              JSON.stringify(result),
              { ex: 60 * 60 * 24 * 7 },
            );
          }
        }),
    );
  }

  // Round-trip 2 (conditional): athletes from cache
  let athletes: any[] = [];

  if (userIds && userIds.length > 0) {
    const pipeline = setRedis.pipeline();
    for (const id of userIds) {
      pipeline.get(`athletes:user:${id}`);
    }

    // Fire pipeline + DB fallbacks in parallel
    const [pipelineResults] = await Promise.all([
      pipeline.exec(),
      fallbacks.length > 0 ? Promise.all(fallbacks) : Promise.resolve(),
    ]);

    athletes = (pipelineResults as any[])
      .map((r) => {
        const val = Array.isArray(r) ? r[1] : r;
        if (!val) return null;
        return typeof val === "string" ? JSON.parse(val) : val;
      })
      .filter(Boolean);
  } else {
    // Cold start — wait for fallbacks first, then hit DB for athletes
    if (fallbacks.length > 0) await Promise.all(fallbacks);

    const dbAthletes = await prisma.athleteProfile.findMany({
      take: 100,
      include: {
        user: {
          select: {
            email: true,
            name: true,
            userToken: true,
            inTeam: true,
            is_Onboard: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    athletes = dbAthletes.map(({ user, ...a }) => ({
      userToken: user.userToken,
      email: user.email,
      name: user.name,
      inTeam: user.inTeam,
      isOnboard: user.is_Onboard,
      profileImage: user.profileImage,
      athleteData: a,
    }));

    if (athletes.length > 0) {
      const pipeline = setRedis.pipeline();
      for (const athlete of athletes) {
        const uid = athlete.athleteData.userId;
        pipeline.set(
          `athletes:user:${uid}`,
          JSON.stringify(athlete),
          { ex: 60 * 60 * 24 * 7 },
        );
        pipeline.lpush("athletes:index", uid);
      }
      pipeline.expire("athletes:index", 60 * 60);
      await pipeline.exec();
    }
  }

  // Derive missing team slots — pure computation, no extra I/O
  const filledRoles = new Set<string>(
    (team?.members ?? []).map((m: any) => m.role),
  );
  const missingSlots = (["SWIMMER", "CYCLIST", "RUNNER"] as const).filter(
    (d) => !filledRoles.has(d),
  );

  return {
    success: true,
    error: false,
    message: "",
    data: {
      athletes,
      sentInvites,   
      missingSlots,  
      hasTeam: !!team,
    },
  };
});
