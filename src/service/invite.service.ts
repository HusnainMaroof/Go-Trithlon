import { Discipline } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import {
  ActionResponse,
  InvitesData,
  ReceivedInvite,
  SentInvite,
} from "../type/inviteTypes";

// ─── CACHE CONFIG ─────────────────────────────────────────────────────────────

const TTL = {
  receivedPending: 10,
  sentPending: 30,
  resolved: 120,
  team: 60 * 60 * 24 * 7,
} as const;

const cacheKey = {
  receivedPending: (userId: string) => `invites:received:pending:${userId}`,
  sentPending: (userId: string) => `invites:sent:pending:${userId}`,
  sentDeclined: (userId: string) => `invites:sent:declined:${userId}`,
  accepted: (userId: string) => `invites:received:accepted:${userId}`,
  rejected: (userId: string) => `invites:received:rejected:${userId}`,
  myTeam: (userId: string) => `myteam:${userId}`,
  session: (userId: string) => `auth_session:${userId}`,
} as const;

// ─── CACHE HELPERS ────────────────────────────────────────────────────────────

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await setRedis.get(key);
    if (!raw) return null;
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
  } catch {
    return null;
  }
}

async function setCached(
  key: string,
  data: unknown,
  ttl: number,
): Promise<void> {
  try {
    await setRedis.set(key, JSON.stringify(data), { ex: ttl });
  } catch {
    // Non-fatal
  }
}

async function bustCache(...keys: string[]): Promise<void> {
  try {
    await Promise.all(keys.map((k) => setRedis.del(k)));
  } catch {
    // Non-fatal — stale data expires via TTL
  }
}

// ─── SHARED PRISMA INCLUDES ───────────────────────────────────────────────────

const receivedInclude = {
  team: { select: { id: true, name: true, status: true } },
  fromUser: {
    select: {
      id: true,
      name: true,
      athleteProfile: { select: { displayName: true, locationCity: true } },
    },
  },
} as const;

const sentInclude = {
  team: { select: { id: true, name: true, status: true } },
  toUser: {
    select: {
      id: true,
      name: true,
      athleteProfile: { select: { displayName: true, locationCity: true } },
    },
  },
  fromUser: {
    select: {
      id: true,
      name: true,
      athleteProfile: { select: { displayName: true, locationCity: true } },
    },
  },
} as const;

const teamInclude = {
  members: {
    include: {
      user: { include: { athleteProfile: true } },
    },
  },
} as const;

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export const inviteService = {
  // ── GET INVITES ─────────────────────────────────────────────────────────────

  async getInvites(userId: string): Promise<ActionResponse<InvitesData>> {
    try {
      const rKey = cacheKey.receivedPending(userId);
      const sKey = cacheKey.sentPending(userId);
      const sdKey = cacheKey.sentDeclined(userId);
      const aKey = cacheKey.accepted(userId);
      const rejKey = cacheKey.rejected(userId);

      const [
        cachedReceived,
        cachedSent,
        cachedSentDeclined,
        cachedAccepted,
        cachedRejected,
      ] = await Promise.all([
        getCached<ReceivedInvite[]>(rKey),
        getCached<SentInvite[]>(sKey),
        getCached<SentInvite[]>(sdKey),
        getCached<ReceivedInvite[]>(aKey),
        getCached<ReceivedInvite[]>(rejKey),
      ]);

      const allCached =
        cachedReceived &&
        cachedSent &&
        cachedSentDeclined &&
        cachedAccepted &&
        cachedRejected;

      if (allCached) {
        return {
          success: true,
          error: false,
          message: "Invites fetched from cache",
          data: {
            received: cachedReceived,
            sent: cachedSent,
            sentDeclined: cachedSentDeclined,
            accepted: cachedAccepted,
            rejected: cachedRejected,
          },
        };
      }

      const [
        freshReceived,
        freshSent,
        freshSentDeclined,
        freshAccepted,
        freshRejected,
      ] = await Promise.all([
        cachedReceived
          ? Promise.resolve(cachedReceived)
          : prisma.teamInvite.findMany({
              where: { toUserId: userId, status: "PENDING" },
              include: receivedInclude,
              orderBy: { createdAt: "desc" },
            }),

        cachedSent
          ? Promise.resolve(cachedSent)
          : prisma.teamInvite.findMany({
              where: { fromUserId: userId, status: "PENDING" },
              include: sentInclude,
              orderBy: { createdAt: "desc" },
            }),

        cachedSentDeclined
          ? Promise.resolve(cachedSentDeclined)
          : prisma.teamInvite.findMany({
              where: { fromUserId: userId, status: "REJECTED" },
              include: sentInclude,
              orderBy: { updatedAt: "desc" },
            }),

        cachedAccepted
          ? Promise.resolve(cachedAccepted)
          : prisma.teamInvite.findMany({
              where: { toUserId: userId, status: "ACCEPTED" },
              include: receivedInclude,
              orderBy: { createdAt: "desc" },
            }),

        cachedRejected
          ? Promise.resolve(cachedRejected)
          : prisma.teamInvite.findMany({
              where: { toUserId: userId, status: "REJECTED" },
              include: receivedInclude,
              orderBy: { createdAt: "desc" },
            }),
      ]);

      void Promise.all([
        ...(!cachedReceived
          ? [setCached(rKey, freshReceived, TTL.receivedPending)]
          : []),
        ...(!cachedSent ? [setCached(sKey, freshSent, TTL.sentPending)] : []),
        ...(!cachedSentDeclined
          ? [setCached(sdKey, freshSentDeclined, TTL.resolved)]
          : []),
        ...(!cachedAccepted
          ? [setCached(aKey, freshAccepted, TTL.resolved)]
          : []),
        ...(!cachedRejected
          ? [setCached(rejKey, freshRejected, TTL.resolved)]
          : []),
      ]);

      return {
        success: true,
        error: false,
        message: "Invites fetched successfully",
        data: {
          received: freshReceived as ReceivedInvite[],
          sent: freshSent as SentInvite[],
          sentDeclined: freshSentDeclined as SentInvite[],
          accepted: freshAccepted as ReceivedInvite[],
          rejected: freshRejected as ReceivedInvite[],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        message:
          error instanceof Error ? error.message : "Failed to fetch invites",
        data: null,
      };
    }
  },

  // ── SEND INVITE ─────────────────────────────────────────────────────────────

  async sendInvite(
    fromUserId: string,
    payload: { toUserId: string; role: Discipline },
  ): Promise<ActionResponse> {
    try {
      const team = await prisma.myTeam.findFirst({
        where: { ownerId: fromUserId },
      });

      if (!team) {
        return {
          success: false,
          error: true,
          message: "Team not found or not owner",
          data: null,
        };
      }

      if (team.status === "COMPLETE") {
        return {
          success: false,
          error: true,
          message: "Team already complete",
          data: null,
        };
      }

      const [roleAlreadyFilled, receiverProfile, existingInvite] =
        await Promise.all([
          prisma.myTeamMember.findUnique({
            where: { teamId_role: { teamId: team.id, role: payload.role } },
          }),
          prisma.athleteProfile.findUnique({
            where: { userId: payload.toUserId },
            select: {
              disciplines: true,
              user: { select: { inTeam: true } }, // Fetch inTeam status for extra safety
            },
          }),
          prisma.teamInvite.findUnique({
            where: {
              teamId_toUserId_role: {
                teamId: team.id,
                toUserId: payload.toUserId,
                role: payload.role,
              },
            },
            select: { status: true },
          }),
        ]);

      if (roleAlreadyFilled) {
        return {
          success: false,
          error: true,
          message: `${payload.role} slot already filled`,
          data: null,
        };
      }

      if (!receiverProfile) {
        return {
          success: false,
          error: true,
          message: "Receiver has no athlete profile",
          data: null,
        };
      }

      if (!receiverProfile.disciplines.includes(payload.role)) {
        return {
          success: false,
          error: true,
          message: "Athlete is not eligible for this role",
          data: null,
        };
      }

      // PREVENT INVITING SOMEONE ALREADY IN A TEAM
      if (receiverProfile.user.inTeam) {
        return {
          success: false,
          error: true,
          message: "This athlete is already in a team",
          data: null,
        };
      }

      // Only block if the invite is actively PENDING
      if (existingInvite && existingInvite.status === "PENDING") {
        return {
          success: false,
          error: true,
          message: "A pending invite already exists for this slot",
          data: null,
        };
      }

      // ── UPSERT ────────────────────────────────────────────────────────────
      // If it was ACCEPTED, REJECTED, or REVOKED, this resets it back to PENDING.
      await prisma.teamInvite.upsert({
        where: {
          teamId_toUserId_role: {
            teamId: team.id,
            toUserId: payload.toUserId,
            role: payload.role,
          },
        },
        update: {
          status: "PENDING",
          fromUserId,
          updatedAt: new Date(),
        },
        create: {
          teamId: team.id,
          fromUserId,
          toUserId: payload.toUserId,
          role: payload.role,
        },
      });

      await bustCache(
        cacheKey.receivedPending(payload.toUserId),
        cacheKey.sentPending(fromUserId),
        cacheKey.sentDeclined(fromUserId), // In case they previously rejected, clear the declined cache
      );

      return {
        success: true,
        error: false,
        message: "Invite sent successfully",
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        message:
          error instanceof Error ? error.message : "Failed to send invite",
        data: null,
      };
    }
  },

  // ── ACCEPT INVITE ───────────────────────────────────────────────────────────

  async acceptInvite(
    userId: string,
    inviteId: string,
  ): Promise<ActionResponse> {
    try {
      // Fetch both the invite AND the accepting user's current status
      const [invite, acceptingUser] = await Promise.all([
        prisma.teamInvite.findUnique({
          where: { id: inviteId },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { inTeam: true },
        }),
      ]);

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
          message: "Invite has already been handled",
          data: null,
        };

      // 🚨 SECURITY CHECK: Prevent joining multiple teams
      if (acceptingUser?.inTeam) {
        return {
          success: false,
          error: true,
          message:
            "You are already in a team. You must leave it before accepting a new invite.",
          data: null,
        };
      }

      const roleAlreadyFilled = await prisma.myTeamMember.findUnique({
        where: { teamId_role: { teamId: invite.teamId, role: invite.role } },
      });

      if (roleAlreadyFilled)
        return {
          success: false,
          error: true,
          message: "This role has already been filled by someone else",
          data: null,
        };

      await prisma.$transaction([
        prisma.myTeamMember.create({
          data: { teamId: invite.teamId, userId, role: invite.role },
        }),
        prisma.teamInvite.update({
          where: { id: invite.id },
          data: { status: "ACCEPTED" },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { inTeam: true },
        }),
      ]);

      const updatedTeam = await prisma.myTeam.findUnique({
        where: { id: invite.teamId },
        include: teamInclude,
      });

      const sessionKey = cacheKey.session(userId);
      const cachedSession =
        await getCached<Record<string, unknown>>(sessionKey);

      await Promise.all([
        bustCache(
          cacheKey.receivedPending(userId),
          cacheKey.accepted(userId),
          cacheKey.sentPending(invite.fromUserId),
          cacheKey.sentDeclined(invite.fromUserId),
        ),

        updatedTeam
          ? setCached(cacheKey.myTeam(invite.fromUserId), updatedTeam, TTL.team)
          : setRedis.del(cacheKey.myTeam(invite.fromUserId)),

        updatedTeam
          ? setCached(cacheKey.myTeam(userId), updatedTeam, TTL.team)
          : Promise.resolve(),

        cachedSession
          ? (async () => {
              const ttl = await setRedis.ttl(sessionKey);
              const updated = { ...cachedSession, inTeam: true };
              await setRedis.set(
                sessionKey,
                JSON.stringify(updated),
                ttl > 0 ? { ex: ttl } : undefined,
              );
            })()
          : Promise.resolve(),
      ]);

      return {
        success: true,
        error: false,
        message: "Invite accepted",
        data: { teamId: invite.teamId, role: invite.role },
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        message:
          error instanceof Error ? error.message : "Failed to accept invite",
        data: null,
      };
    }
  },

  // ── REJECT INVITE ───────────────────────────────────────────────────────────

  async rejectInvite(
    userId: string,
    inviteId: string,
  ): Promise<ActionResponse> {
    try {
      const invite = await prisma.teamInvite.findUnique({
        where: { id: inviteId },
        select: { id: true, toUserId: true, fromUserId: true, status: true },
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
          message: "Invite has already been handled",
          data: null,
        };

      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "REJECTED" },
      });

      await bustCache(
        cacheKey.receivedPending(userId),
        cacheKey.rejected(userId),
        cacheKey.sentPending(invite.fromUserId),
        cacheKey.sentDeclined(invite.fromUserId),
      );

      return {
        success: true,
        error: false,
        message: "Invite declined successfully",
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        message:
          error instanceof Error ? error.message : "Failed to decline invite",
        data: null,
      };
    }
  },

  // ── REVOKE INVITE ───────────────────────────────────────────────────────────

  async revokeInvite(
    userId: string,
    inviteId: string,
  ): Promise<ActionResponse> {
    try {
      const invite = await prisma.teamInvite.findUnique({
        where: { id: inviteId },
        select: { id: true, fromUserId: true, toUserId: true, status: true },
      });

      if (!invite)
        return {
          success: false,
          error: true,
          message: "Invite not found",
          data: null,
        };
      if (invite.fromUserId !== userId)
        return {
          success: false,
          error: true,
          message: "You did not send this invite",
          data: null,
        };
      if (invite.status !== "PENDING")
        return {
          success: false,
          error: true,
          message: "Invite has already been handled",
          data: null,
        };

      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "REVOKED" },
      });

      await bustCache(
        cacheKey.sentPending(userId),
        cacheKey.receivedPending(invite.toUserId),
      );

      return {
        success: true,
        error: false,
        message: "Invite revoked successfully",
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        message:
          error instanceof Error ? error.message : "Failed to revoke invite",
        data: null,
      };
    }
  },

  // ── MARK INVITES AS READ ───────────────────────────────────────────────────

  async markAsRead(userId: string): Promise<ActionResponse> {
    try {
      await prisma.teamInvite.updateMany({
        where: { 
          toUserId: userId, 
          status: "PENDING",
          isRead: false // Only update ones that haven't been read
        },
        data: { isRead: true },
      });

      // Bust the cache so the next fetch gets the updated `isRead` statuses
      await bustCache(cacheKey.receivedPending(userId));

      return {
        success: true,
        error: false,
        message: "Invites marked as read",
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        error: true,
        message: "Failed to mark invites as read",
        data: null,
      };
    }
  },
};
