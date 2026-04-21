"use server";

import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
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

    return {
      success: true,
      error: false,
      message: "Profile created successfully",
      data: updatedSessionData,
    };
  },
);

// // ─────────────────────────────────────────────
// // CREATE TEAM
// // ─────────────────────────────────────────────
// export const createTeamAction = catchErrors(
//   async (
//     _prevState: ActionResponse,
//     payload: createTeamPayload,
//   ): Promise<ActionResponse> => {
//     const getFromUser = await getCurrentUser();
//     const sessionId = getFromUser.authsuccess.data.sessionId;

//     const userData = await getAuthSession({ sessionId });
//     if (!userData?.data)
//       return {
//         success: false,
//         error: true,
//         message: "No session data",
//         data: null,
//       };

//     const userId = userData.data.userId;
//     const userName = userData.data.name;
//     const athleteData = userData.data.athleteData;

//     if (!athleteData)
//       return {
//         success: false,
//         error: true,
//         message: "Complete your profile first",
//         data: null,
//       };

//     // prevent user from owning multiple teams
//     const existingTeam = await prisma.myTeam.findFirst({
//       where: { ownerId: userId },
//     });

//     if (existingTeam)
//       return {
//         success: false,
//         error: true,
//         message: "You already have a team",
//         data: existingTeam,
//       };

//     // create team
//     const team = await prisma.myTeam.create({
//       data: {
//         name: payload.teamName,
//         ownerId: userId,
//       },
//     });

//     const cacheKey = `myteam:${userId}`;

//     const expiresAt = 60 * 60 * 24 * 7;
//     await setRedis.set(cacheKey, JSON.stringify(team), { ex: expiresAt });

//     return {
//       success: true,
//       error: false,
//       message: "Team created successfully",
//       data: team,
//     };
//   },
// );

// // ─────────────────────────────────────────────
// // GET My Team (with Redis cache)
// // ─────────────────────────────────────────────

// export const getMyTeamAction = catchErrors(
//   async (
//     _prevState: ActionResponse,
//     _payload: unknown,
//   ): Promise<ActionResponse> => {
//     const getFromUser = await getCurrentUser();
//     const sessionId = getFromUser.authsuccess.data.sessionId;

//     const userData = await getAuthSession({ sessionId });
//     if (!userData?.data)
//       return {
//         success: false,
//         error: true,
//         message: "No session data",
//         data: null,
//       };

//     const userId = userData.data.userId;
//     const cacheKey = `myteam:${userId}`;

//     // ── 1. check cache ──
//     const cached = await setRedis.get(cacheKey);
//     if (cached) {
//       const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
//       return {
//         success: true,
//         error: false,
//         data: parsed,
//         message: "cached team found",
//       };
//     }

//     // ── 2. fetch from DB ──
// const myteam = await prisma.myTeam.findFirst({
//       where: {
//         ownerId: userId,
//       },
//       include: {
//         members: {
//           include: {
//             user: {
//               include: {
//                 athleteProfile: true,
//               },
//             },
//           },
//         },
//       },
//     });

//     console.log("from action ", myteam);

//     if (!myteam)
//       return {
//         success: false,
//         error: true,
//         message: "no team",
//         data: null,
//       };

//       // ── 4. Set Cache & Return ──
//     const expiresAt = 60 * 60 * 24 * 7;
//     await setRedis.set(cacheKey, JSON.stringify(myteam), { ex: expiresAt });

//     return {
//       success: true,
//       error: false,
//       data: myteam,
//       message: "team found"
//     };
//   },
// );

// team action

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

    console.log("payloafkakjdjnvojd", userData?.data?.athleteData);

    switch (payload.service) {
      case "GET_TEAM":
        return getTeamService(userId);

      case "CREATE_TEAM":
        return createTeamService(userId, payload.teamName); // ✅ FIXED

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

// ─────────────────────────────────────────────
// SEND INVITE
// ─────────────────────────────────────────────
export const sendInvitesActions = catchErrors(
  async (
    _prevState: ActionResponse,
    payload: sendInvitesPayload,
  ): Promise<ActionResponse> => {
    const getFromUser = await getCurrentUser();
    const sessionId = getFromUser.authsuccess.data.sessionId;

    const fromUserData = await getAuthSession({ sessionId });
    if (!fromUserData?.data)
      return {
        success: false,
        error: true,
        message: "No session data",
        data: null,
      };

    const fromUserId = fromUserData.data.userId;

    // ── 1. sender must own the team ──
    const team = await prisma.myTeam.findFirst({
      where: { id: payload.teamId, ownerId: fromUserId },
    });

    if (!team)
      return {
        success: false,
        error: true,
        message: "Team not found or you are not the owner",
        data: null,
      };

    // ── 2. team must not already be complete ──
    if (team.status === "COMPLETE")
      return {
        success: false,
        error: true,
        message: "Team is already complete",
        data: null,
      };

    // ── 3. role slot must be empty ──
    const roleAlreadyFilled = await prisma.myTeamMember.findUnique({
      where: {
        teamId_role: {
          teamId: payload.teamId,
          role: payload.role,
        },
      },
    });

    if (roleAlreadyFilled)
      return {
        success: false,
        error: true,
        message: `${payload.role} slot is already filled`,
        data: null,
      };

    // ── 4. fetch receiver's athlete profile directly by userId ──
    const receiverProfile = await prisma.athleteProfile.findUnique({
      where: { userId: payload.toUserId },
    });

    if (!receiverProfile)
      return {
        success: false,
        error: true,
        message: "Receiver has no athlete profile",
        data: null,
      };

    // ── 5. receiver must have the discipline for the role ──
    if (!receiverProfile.disciplines.includes(payload.role)) {
      return {
        success: false,
        error: true,
        message: `This athlete cannot perform ${payload.role}`,
        data: null,
      };
    }

    // ── 6. no duplicate pending invite for same role ──
    const duplicateInvite = await prisma.teamInvite.findUnique({
      where: {
        teamId_toUserId_role: {
          teamId: payload.teamId,
          toUserId: payload.toUserId,
          role: payload.role,
        },
      },
    });

    if (duplicateInvite)
      return {
        success: false,
        error: true,
        message: "Invite already sent for this role",
        data: null,
      };

    // ── 7. create invite ──
    const invite = await prisma.teamInvite.create({
      data: {
        teamId: payload.teamId,
        fromUserId,
        toUserId: payload.toUserId,
        role: payload.role,
      },
    });

    // ── 8. invalidate receiver's invite cache ──
    await setRedis.del(`invites:${payload.toUserId}`);

    return {
      success: true,
      error: false,
      message: "Invite sent successfully",
      data: invite,
    };
  },
);

// ─────────────────────────────────────────────
// GET INVITES (with Redis cache)
// ─────────────────────────────────────────────
export const getInvitesAction = catchErrors(
  async (
    _prevState: ActionResponse,
    _payload: unknown,
  ): Promise<ActionResponse> => {
    const getFromUser = await getCurrentUser();
    const sessionId = getFromUser.authsuccess.data.sessionId;

    const userData = await getAuthSession({ sessionId });
    if (!userData?.data)
      return {
        success: false,
        error: true,
        message: "No session data",
        data: null,
      };

    const userId = userData.data.userId;
    const cacheKey = `invites:${userId}`;

    // ── 1. check cache ──
    const cached = await setRedis.get(cacheKey);
    if (cached) {
      const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      return { success: true, error: false, data: parsed };
    }

    // ── 2. fetch from DB ──
    const invites = await prisma.teamInvite.findMany({
      where: {
        toUserId: userId,
        status: "PENDING",
      },
      include: {
        team: {
          select: { id: true, name: true, status: true },
        },
        fromUser: {
          select: {
            id: true,
            name: true,
            athleteProfile: {
              select: { displayName: true, locationCity: true },
            },
          },
        },
      },
    });

    // ── 3. cache for 10 seconds ──
    await setRedis.set(cacheKey, JSON.stringify(invites), { ex: 10 });

    return { success: true, error: false, data: invites };
  },
);

// ─────────────────────────────────────────────
// ACCEPT INVITE
// ─────────────────────────────────────────────
export const acceptInviteAction = catchErrors(
  async (
    _prevState: ActionResponse,
    payload: acceptInvitePayload,
  ): Promise<ActionResponse> => {
    const getFromUser = await getCurrentUser();
    const sessionId = getFromUser.authsuccess.data.sessionId;

    const userData = await getAuthSession({ sessionId });
    if (!userData?.data)
      return {
        success: false,
        error: true,
        message: "No session data",
        data: null,
      };

    const userId = userData.data.userId;

    // ── 1. get invite ──
    const invite = await prisma.teamInvite.findUnique({
      where: { id: payload.inviteId },
    });

    if (!invite)
      return {
        success: false,
        error: true,
        message: "Invite not found",
        data: null,
      };

    if (invite.toUserId !== userId)
      return {
        success: false,
        error: true,
        message: "This invite is not for you",
        data: null,
      };

    if (invite.status !== "PENDING")
      return {
        success: false,
        error: true,
        message: "Invite already responded to",
        data: null,
      };

    // ── 2. check role still open ──
    const roleAlreadyFilled = await prisma.myTeamMember.findUnique({
      where: {
        teamId_role: {
          teamId: invite.teamId,
          role: invite.role,
        },
      },
    });

    if (roleAlreadyFilled)
      return {
        success: false,
        error: true,
        message: "Role was filled before you could accept",
        data: null,
      };

    // ── 3. add as team member ──
    await prisma.myTeamMember.create({
      data: {
        teamId: invite.teamId,
        userId,
        role: invite.role,
      },
    });

    // ── 4. mark invite accepted ──
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });

    // ── 5. check if team is now complete (all 3 roles filled) ──
    const memberCount = await prisma.myTeamMember.count({
      where: { teamId: invite.teamId },
    });

    if (memberCount === 3) {
      await prisma.myTeam.update({
        where: { id: invite.teamId },
        data: { status: "COMPLETE" },
      });
    }

    // ── 6. invalidate cache ──
    await setRedis.del(`invites:${userId}`);

    return {
      success: true,
      error: false,
      message: "Invite accepted. You joined the team.",
      data: null,
    };
  },
);

// ─────────────────────────────────────────────
// REJECT INVITE
// ─────────────────────────────────────────────
export const rejectInviteAction = catchErrors(
  async (
    _prevState: ActionResponse,
    payload: acceptInvitePayload,
  ): Promise<ActionResponse> => {
    const getFromUser = await getCurrentUser();
    const sessionId = getFromUser.authsuccess.data.sessionId;

    const userData = await getAuthSession({ sessionId });
    if (!userData?.data)
      return {
        success: false,
        error: true,
        message: "No session data",
        data: null,
      };

    const userId = userData.data.userId;

    const invite = await prisma.teamInvite.findUnique({
      where: { id: payload.inviteId },
    });

    if (!invite)
      return {
        success: false,
        error: true,
        message: "Invite not found",
        data: null,
      };

    if (invite.toUserId !== userId)
      return {
        success: false,
        error: true,
        message: "This invite is not for you",
        data: null,
      };

    if (invite.status !== "PENDING")
      return {
        success: false,
        error: true,
        message: "Invite already responded to",
        data: null,
      };

    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "REJECTED" },
    });

    await setRedis.del(`invites:${userId}`);

    return {
      success: true,
      error: false,
      message: "Invite rejected",
      data: null,
    };
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
  const cacheKey = "athletes:global:limit:100";

  // 1️⃣ Try cache first
  const cached = await setRedis.get(cacheKey);

  const sessionData = typeof cached === "string" ? JSON.parse(cached) : cached;

  if (cached) {
    return {
      success: true,
      error: false,
      message: "From cache",
      data: sessionData,
    };
  }

  // 2️⃣ Fetch from DB
  const athletes = await prisma.athleteProfile.findMany({
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
    orderBy: {
      createdAt: "desc",
    },
  });

  // 3️⃣ Transform data
  const formatted = athletes.map(({ user, ...a }) => ({
    userToken: user.userToken,
    email: user.email,
    name: user.name,
    inTeam: user.inTeam,
    isOnboard: user.is_Onboard,
    profileImage: user.profileImage, // update when schema supports it

    athleteData: a,
  }));

  // 4️⃣ Store in Redis
  await setRedis.set(cacheKey, JSON.stringify(formatted), { ex: 6000 });

  // 5️⃣ Return response
  return {
    success: true,
    error: false,
    message: "From DB",
    data: formatted,
  };
});
