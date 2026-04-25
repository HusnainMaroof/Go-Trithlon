// services/inviteService.ts

import { Discipline } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import { ReceivedInvite, SentInvite } from "../type/inviteTypes";

// ─── CACHE CONFIG ─────────────────────────────────────────────────────────────

const RECEIVED_TTL = 10;
const SENT_TTL = 30;

const cacheKey = {
  received: (userId: string) => `invites:received:${userId}`,
  sent: (userId: string) => `invites:sent:${userId}`,
  team: (userId: string) => `myteam:${userId}`,
} as const;

// ─── CACHE HELPERS ────────────────────────────────────────────────────────────

async function getCached<T>(key: string): Promise<T | null> {
  const raw = await setRedis.get(key);
  if (!raw) return null;
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
}

async function setCached(
  key: string,
  data: unknown,
  ttl: number,
): Promise<void> {
  await setRedis.set(key, JSON.stringify(data), { ex: ttl });
}

async function bustCache(...keys: string[]): Promise<void> {
  await Promise.all(keys.map((k) => setRedis.del(k)));
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export const inviteService = {
  async getInvites(userId: string): Promise<any> {
    const rKey = cacheKey.received(userId);
    const sKey = cacheKey.sent(userId);

    const [cachedReceived, cachedSent] = await Promise.all([
      getCached<ReceivedInvite[]>(rKey),
      getCached<SentInvite[]>(sKey),
    ]);

    if (cachedReceived && cachedSent) {
      return { received: cachedReceived, sent: cachedSent };
    }

    const [freshReceived, freshSent] = await Promise.all([
      cachedReceived
        ? Promise.resolve(cachedReceived)
        : prisma.teamInvite.findMany({
            where: { toUserId: userId, status: "PENDING" },
            include: {
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
            },
            orderBy: { createdAt: "desc" },
          }),

      cachedSent
        ? Promise.resolve(cachedSent)
        : prisma.teamInvite.findMany({
            where: { fromUserId: userId, status: "PENDING" },
            include: {
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
            },
            orderBy: { createdAt: "desc" },
          }),
    ]);

    await Promise.all([
      ...(!cachedReceived
        ? [setCached(rKey, freshReceived, RECEIVED_TTL)]
        : []),
      ...(!cachedSent ? [setCached(sKey, freshSent, SENT_TTL)] : []),
    ]);

    return {
      received: freshReceived as ReceivedInvite[],
      sent: freshSent as SentInvite[],
    };
  },

  async sendInvite(
    fromUserId: string,
    payload: { toUserId: string; role: Discipline },
  ): Promise<void> {
    const team = await prisma.myTeam.findFirst({
      where: { ownerId: fromUserId },
    });
    if (!team) throw new Error("Team not found or you are not the owner");
    if (team.status === "COMPLETE") throw new Error("Team is already complete");

    const [roleAlreadyFilled, receiverProfile, duplicateInvite] =
      await Promise.all([
        prisma.myTeamMember.findUnique({
          where: { teamId_role: { teamId: team.id, role: payload.role } },
        }),
        // Only fetch what we need
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

    if (roleAlreadyFilled)
      throw new Error(`${payload.role} slot is already filled`);
    if (!receiverProfile) throw new Error("Receiver has no athlete profile");
    if (!receiverProfile.disciplines.includes(payload.role))
      throw new Error(`This athlete cannot perform ${payload.role}`);

    // Allow re-invite only if previous was REJECTED or REVOKED
    if (
      duplicateInvite &&
      duplicateInvite.status !== "REJECTED" &&
      duplicateInvite.status !== "REVOKED"
    )
      throw new Error("Invite already sent for this role");

    await prisma.teamInvite.create({
      data: {
        teamId: team.id,
        fromUserId,
        toUserId: payload.toUserId,
        role: payload.role,
      },
    });

    await bustCache(
      cacheKey.received(payload.toUserId),
      cacheKey.sent(fromUserId),
    );
  },

  async acceptInvite(
    userId: string,
    inviteId: string,
  ): Promise<{ teamId: string; role: Discipline }> {
    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) throw new Error("Invite not found");
    if (invite.toUserId !== userId)
      throw new Error("This invite is not for you");
    if (invite.status !== "PENDING")
      throw new Error("Invite already responded to");

    const roleAlreadyFilled = await prisma.myTeamMember.findUnique({
      where: { teamId_role: { teamId: invite.teamId, role: invite.role } },
    });
    if (roleAlreadyFilled)
      throw new Error("This slot was filled before you could accept");

    await Promise.all([
      prisma.myTeamMember.create({
        data: { teamId: invite.teamId, userId, role: invite.role },
      }),
      prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED" },
      }),
      // Use update not updateMany — id is unique
      prisma.user.update({
        where: { id: userId },
        data: { inTeam: true },
      }),
    ]);

    const memberCount = await prisma.myTeamMember.count({
      where: { teamId: invite.teamId },
    });

    if (memberCount === 3) {
      await prisma.myTeam.update({
        where: { id: invite.teamId },
        data: { status: "COMPLETE" },
      });
    }

    await bustCache(
      cacheKey.received(userId),
      cacheKey.sent(invite.fromUserId),
      cacheKey.team(invite.fromUserId),
    );

    return { teamId: invite.teamId, role: invite.role };
  },

  async rejectInvite(userId: string, inviteId: string): Promise<void> {
    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
    });



console.log("from service rej",invite);


    // if (!invite) throw new Error("Invite not found");
    // if (invite.toUserId !== userId)
    //   throw new Error("This invite is not for you");
    // if (invite.status !== "PENDING")
    //   throw new Error("Invite already responded to");

    // await prisma.teamInvite.update({
    //   where: { id: invite.id },
    //   data: { status: "REJECTED" },
    // });

    // await bustCache(
    //   cacheKey.received(userId),
    //   cacheKey.sent(invite.fromUserId),
    // );
  },

  async revokeInvite(userId: string, inviteId: string): Promise<void> {
    const invite = await prisma.teamInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) throw new Error("Invite not found");
    if (invite.fromUserId !== userId)
      throw new Error("You did not send this invite");
    if (invite.status !== "PENDING")
      throw new Error("Invite is no longer pending");

    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "REVOKED" },
    });

    await bustCache(cacheKey.sent(userId), cacheKey.received(invite.toUserId));
  },
};
