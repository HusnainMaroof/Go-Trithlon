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
  resolved: 120, // accepted/rejected mutate rarely
} as const;

const cacheKey = {
  receivedPending: (userId: string) => `invites:received:pending:${userId}`,
  sentPending: (userId: string) => `invites:sent:pending:${userId}`,
  sentDeclined: (userId: string) => `invites:sent:declined:${userId}`, // ← NEW
  accepted: (userId: string) => `invites:received:accepted:${userId}`,
  rejected: (userId: string) => `invites:received:rejected:${userId}`,
} as const;
// ─── CACHE HELPERS ────────────────────────────────────────────────────────────

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await setRedis.get(key);
    if (!raw) return null;
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
  } catch {
    // Never let a cache read break the request
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
    // Cache write failure is non-fatal
  }
}

async function bustCache(...keys: string[]): Promise<void> {
  try {
    await Promise.all(keys.map((k) => setRedis.del(k)));
  } catch {
    // Cache bust failure is non-fatal — stale data will expire naturally
  }
}

// ─── SHARED PRISMA INCLUDES ───────────────────────────────────────────────────

const receivedInclude = {
  team: { select: { id: true, name: true, status: true } },
  fromUser: {
    select: {
      id: true,
      name: true,
      athleteProfile: {
        select: { displayName: true, locationCity: true },
      },
    },
  },
} as const;

const sentInclude = {
  team: { select: { id: true, name: true, status: true } },
  toUser: {
    select: {
      id: true,
      name: true,
      athleteProfile: {
        select: { displayName: true, locationCity: true },
      },
    },
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
} as const;

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export const inviteService = {
  // ── GET INVITES ─────────────────────────────────────────────────────────────

  async getInvites(userId: string): Promise<ActionResponse<InvitesData>> {
    try {
      const rKey = cacheKey.receivedPending(userId);
      const sKey = cacheKey.sentPending(userId);
      const sdKey = cacheKey.sentDeclined(userId); // ← NEW
      const aKey = cacheKey.accepted(userId);
      const rejKey = cacheKey.rejected(userId);

      const [
        cachedReceived,
        cachedSent,
        cachedSentDeclined, // ← NEW
        cachedAccepted,
        cachedRejected,
      ] = await Promise.all([
        getCached<ReceivedInvite[]>(rKey),
        getCached<SentInvite[]>(sKey),
        getCached<SentInvite[]>(sdKey), // ← NEW
        getCached<ReceivedInvite[]>(aKey),
        getCached<ReceivedInvite[]>(rejKey),
      ]);

      const allCached =
        cachedReceived &&
        cachedSent &&
        cachedSentDeclined && // ← NEW
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
            sentDeclined: cachedSentDeclined, // ← NEW
            accepted: cachedAccepted,
            rejected: cachedRejected,
          },
        };
      }

      const [
        freshReceived,
        freshSent,
        freshSentDeclined, // ← NEW
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

        // ← NEW: invites you sent that the recipient declined
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
          : []), // ← NEW
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
          sentDeclined: freshSentDeclined as SentInvite[], // ← NEW
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

      const [roleAlreadyFilled, receiverProfile, duplicateInvite] =
        await Promise.all([
          prisma.myTeamMember.findUnique({
            where: {
              teamId_role: { teamId: team.id, role: payload.role },
            },
          }),
          prisma.athleteProfile.findUnique({
            where: { userId: payload.toUserId },
            select: { disciplines: true },
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

      if (
        duplicateInvite &&
        !["REJECTED", "REVOKED"].includes(duplicateInvite.status)
      ) {
        return {
          success: false,
          error: true,
          message: "An active invite already exists",
          data: null,
        };
      }

      await prisma.teamInvite.create({
        data: {
          teamId: team.id,
          fromUserId,
          toUserId: payload.toUserId,
          role: payload.role,
        },
      });

      // Bust pending buckets for both sides
      await bustCache(
        cacheKey.receivedPending(payload.toUserId),
        cacheKey.sentPending(fromUserId),
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
      const invite = await prisma.teamInvite.findUnique({
        where: { id: inviteId },
      });

      if (!invite) {
        return {
          success: false,
          error: true,
          message: "Invite not found",
          data: null,
        };
      }

      if (invite.toUserId !== userId) {
        return {
          success: false,
          error: true,
          message: "This invite is not for you",
          data: null,
        };
      }

      if (invite.status !== "PENDING") {
        return {
          success: false,
          error: true,
          message: "Invite has already been handled",
          data: null,
        };
      }

      const roleAlreadyFilled = await prisma.myTeamMember.findUnique({
        where: {
          teamId_role: { teamId: invite.teamId, role: invite.role },
        },
      });

      if (roleAlreadyFilled) {
        return {
          success: false,
          error: true,
          message: "This role has already been filled by someone else",
          data: null,
        };
      }

      await Promise.all([
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

      // Bust:
      // - receivedPending (invite is no longer pending)
      // - accepted        (new entry now exists there)
      // - sentPending     (sender's outgoing pending list changes)
      await bustCache(
        cacheKey.receivedPending(userId),
        cacheKey.accepted(userId),
        cacheKey.sentPending(invite.fromUserId),
      );

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

      if (!invite) {
        return {
          success: false,
          error: true,
          message: "Invite not found",
          data: null,
        };
      }

      if (invite.toUserId !== userId) {
        return {
          success: false,
          error: true,
          message: "This invite is not for you",
          data: null,
        };
      }

      if (invite.status !== "PENDING") {
        return {
          success: false,
          error: true,
          message: "Invite has already been handled",
          data: null,
        };
      }

      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "REJECTED" },
      });

      // rejectInvite — at the end after prisma.update
      await bustCache(
        cacheKey.receivedPending(userId),
        cacheKey.rejected(userId),
        cacheKey.sentPending(invite.fromUserId),
        cacheKey.sentDeclined(invite.fromUserId), // ← NEW: sender now has a declined entry
      );

      return {
        success: true,
        error: false,
        message: "Invite declined successfully",
        data: null,
      };
    } catch (error) {
      console.error("Reject Invite Error:", error);
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

      if (!invite) {
        return {
          success: false,
          error: true,
          message: "Invite not found",
          data: null,
        };
      }

      if (invite.fromUserId !== userId) {
        return {
          success: false,
          error: true,
          message: "You did not send this invite",
          data: null,
        };
      }

      if (invite.status !== "PENDING") {
        return {
          success: false,
          error: true,
          message: "Invite has already been handled",
          data: null,
        };
      }

      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "REVOKED" },
      });

      // Bust sender's pending sent list and receiver's pending received list
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
      console.error("Revoke Invite Error:", error);
      return {
        success: false,
        error: true,
        message:
          error instanceof Error ? error.message : "Failed to revoke invite",
        data: null,
      };
    }
  },
};
