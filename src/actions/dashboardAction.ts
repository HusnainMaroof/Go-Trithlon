"use server";

import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import {
  acceptInvitePayload,
  createTeamPayload,
  sendInvitesPayload,
  setProfilePayload,
} from "../type/dashboardtype";
import { catchErrors } from "../utlis/ErrorWrapper";
import { getAuthSession } from "../utlis/helper";

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
    const sessionId = getUser.authsuccess.data.sessionId;

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

// ─────────────────────────────────────────────
// CREATE TEAM
// ─────────────────────────────────────────────
export const createTeamAction = catchErrors(
  async (
    _prevState: ActionResponse,
    payload: createTeamPayload,
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
    const userName = userData.data.name;
    const athleteData = userData.data.athleteData;

    if (!athleteData)
      return {
        success: false,
        error: true,
        message: "Complete your profile first",
        data: null,
      };

    // prevent user from owning multiple teams
    const existingTeam = await prisma.myTeam.findFirst({
      where: { ownerId: userId },
    });

    if (existingTeam)
      return {
        success: false,
        error: true,
        message: "You already have a team",
        data: existingTeam,
      };

    // create team
    const team = await prisma.myTeam.create({
      data: {
        name: payload.teamName,
        ownerId: userId,
      },
    });

    const cacheKey = `myteam:${userId}`;

    const expiresAt = 60 * 60 * 24 * 7;
    await setRedis.set(cacheKey, JSON.stringify(team), { ex: expiresAt });

    return {
      success: true,
      error: false,
      message: "Team created successfully",
      data: team,
    };
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
// GET My Team (with Redis cache)
// ─────────────────────────────────────────────
export const getMyTeamAction = catchErrors(
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
    const cacheKey = `myteam:${userId}`;

    // ── 1. check cache ──
    const cached = await setRedis.get(cacheKey);
    if (cached) {
      const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
      return {
        success: true,
        error: false,
        data: parsed,
        message: "cached team found",
      };
    }

    // ── 2. fetch from DB ──
const myteam = await prisma.myTeam.findFirst({
      where: {
        ownerId: userId,
      },
      include: {
        members: {
          include: {
            user: {
              include: {
                athleteProfile: true, 
              },
            },
          },
        },
      },
    });

    console.log("from action ", myteam);

    if (!myteam)
      return {
        success: false,
        error: true, 
        message: "no team",
        data: null,
      };





      // ── 4. Set Cache & Return ──
    const expiresAt = 60 * 60 * 24 * 7; 
    await setRedis.set(cacheKey, JSON.stringify(myteam), { ex: expiresAt });

    return { 
      success: true, 
      error: false, 
      data: myteam, 
      message: "team found" 
    };
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
