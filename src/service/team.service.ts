import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import { ActionResponse, Discipline, Team } from "../type/teamType";
import { updateAthleteInPool } from "./getData.service"; // ← Ensure this path is correct

// ─── Cache Config ─────────────────────────────────────────────────────────────

const TTL = {
  team: 60 * 60 * 24 * 7, // 7 days
} as const;

const cacheKey = {
  myTeam: (userId: string) => `myteam:${userId}`,
  session: (userId: string) => `auth_session:${userId}`,
} as const;

// ─── Cache Helpers ────────────────────────────────────────────────────────────

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

// Helper to update a user's session cache safely
async function syncUserSessionInTeam(userId: string, inTeam: boolean) {
  const sKey = cacheKey.session(userId);
  const cachedSession = await getCached<any>(sKey);
  if (cachedSession) {
    cachedSession.inTeam = inTeam;
    const ttl = await setRedis.ttl(sKey);
    await setCached(sKey, cachedSession, ttl > 0 ? ttl : TTL.team);
  }
}

// ─── Prisma Include ───────────────────────────────────────────────────────────

const teamInclude = {
  members: {
    include: {
      user: { include: { athleteProfile: true } },
    },
  },
} as const;

// ─── Services ─────────────────────────────────────────────────────────────────

export async function getTeamService(
  userId: string,
): Promise<ActionResponse<Team>> {
  try {
    const key = cacheKey.myTeam(userId);
    const cached = await getCached<any>(key);

    // 🚨 STALE CACHE FIX: Check if the cached team is missing the nested 'user' object.
    // If it is, the cache is outdated. We ignore it so Prisma can fetch the fresh relations.
    if (cached && cached.members && cached.members.length > 0) {
      const firstMember = cached.members[0];
      if (!firstMember.user) {
        await bustCache(key); // Force delete the bad cache
      } else {
        return {
          success: true,
          error: false,
          message: "Team fetched from cache",
          data: cached as Team,
        };
      }
    } else if (cached) {
      // Empty team or freshly created team
      return {
        success: true,
        error: false,
        message: "Team fetched from cache",
        data: cached as Team,
      };
    }

    // Check if user owns a team OR is a member of one
    const team = await prisma.myTeam.findFirst({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId: userId } } }],
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

    if (team) {
      void setCached(key, team, TTL.team);
      return {
        success: true,
        error: false,
        message: "Team fetched",
        data: team as unknown as Team,
      };
    }

    return {
      success: true,
      error: false,
      message: "No team found",
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Failed to fetch team",
      data: null,
    };
  }
}

export async function createTeamService(
  userId: string,
  teamName: string,
): Promise<ActionResponse<Team>> {
  try {
    const existing = await prisma.myTeam.findFirst({
      where: { ownerId: userId },
    });
    if (existing) {
      return {
        success: false,
        error: true,
        message: "You already have a team",
        data: null,
      };
    }

    const team = await prisma.myTeam.create({
      data: { name: teamName, ownerId: userId },
      include: teamInclude,
    });

    void setCached(cacheKey.myTeam(userId), team, TTL.team);

    return {
      success: true,
      error: false,
      message: "Team created",
      data: team as unknown as Team,
    };
  } catch (error) {
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Failed to create team",
      data: null,
    };
  }
}

export async function claimSlotService(
  userId: string,
  teamId: string,
  role: Discipline,
  athleteData: Record<string, unknown> | undefined,
): Promise<ActionResponse> {
  try {
    const disciplines = (athleteData?.disciplines as Discipline[]) ?? [];
    if (!disciplines.includes(role)) {
      return {
        success: false,
        error: true,
        message: "You don't have this discipline",
        data: null,
      };
    }

    const alreadyMember = await prisma.myTeamMember.findFirst({
      where: { teamId, userId },
    });
    if (alreadyMember) {
      return {
        success: false,
        error: true,
        message: "You are already in this team",
        data: null,
      };
    }

    const roleAlreadyFilled = await prisma.myTeamMember.findUnique({
      where: { teamId_role: { teamId, role } },
    });
    if (roleAlreadyFilled) {
      return {
        success: false,
        error: true,
        message: "This slot is already filled",
        data: null,
      };
    }

    const team = await prisma.myTeam.findUnique({ where: { id: teamId } });
    if (!team)
      return {
        success: false,
        error: true,
        message: "Team not found",
        data: null,
      };

    await prisma.$transaction([
      prisma.myTeamMember.create({ data: { teamId, userId, role } }),
      prisma.user.update({ where: { id: userId }, data: { inTeam: true } }),
    ]);

    // ── CACHE & GLOBAL POOL SYNC ──
    await bustCache(cacheKey.myTeam(userId), cacheKey.myTeam(team.ownerId));
    await updateAthleteInPool(userId, { inTeam: true });
    await syncUserSessionInTeam(userId, true);

    return { success: true, error: false, message: "Slot claimed", data: null };
  } catch (error) {
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Failed to claim slot",
      data: null,
    };
  }
}

export async function removeFromTeamService(
  requesterId: string,
  memberId: string,
  teamId: string,
): Promise<ActionResponse> {
  try {
    const member = await prisma.myTeamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.teamId !== teamId) {
      return {
        success: false,
        error: true,
        message: "Member not found in team",
        data: null,
      };
    }

    const team = await prisma.myTeam.findUnique({ where: { id: teamId } });
    if (!team)
      return {
        success: false,
        error: true,
        message: "Team not found",
        data: null,
      };

    const isOwner = team.ownerId === requesterId;
    const isSelf = member.userId === requesterId;

    if (!isOwner && !isSelf) {
      return {
        success: false,
        error: true,
        message: "Not authorized to remove this member",
        data: null,
      };
    }

    // ─── THE FIX IS HERE ─────────────────────────────────────────────────────
    await prisma.$transaction([
      // 1. Remove them from the team
      prisma.myTeamMember.delete({ where: { id: memberId } }),
      
      // 2. Delete the old invite so it doesn't linger as "ACCEPTED"
      prisma.teamInvite.deleteMany({
        where: {
          teamId: team.id,
          toUserId: member.userId,
        }
      }),

      // 3. Update their profile status
      prisma.user.update({
        where: { id: member.userId },
        data: { inTeam: false },
      }),
    ]);
    // ─────────────────────────────────────────────────────────────────────────

    // ── CACHE & GLOBAL POOL SYNC ──
    await bustCache(
      cacheKey.myTeam(member.userId),
      cacheKey.myTeam(team.ownerId),
    );
    await updateAthleteInPool(member.userId, { inTeam: false });
    await syncUserSessionInTeam(member.userId, false);

    return {
      success: true,
      error: false,
      message: "Member removed from team",
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error: true,
      message:
        error instanceof Error ? error.message : "Failed to remove member",
      data: null,
    };
  }
}

export async function deleteTeamService(
  userId: string,
  teamId: string,
): Promise<ActionResponse> {
  try {
    const team = await prisma.myTeam.findUnique({ where: { id: teamId } });

    if (!team) {
      return {
        success: false,
        error: true,
        message: "Team not found",
        data: null,
      };
    }

    if (team.ownerId !== userId) {
      return {
        success: false,
        error: true,
        message: "Not the team owner",
        data: null,
      };
    }

    const members = await prisma.myTeamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    // Get all user IDs (members + owner) to reset their states
    const userIdsToReset = Array.from(
      new Set(members.map((m) => m.userId).concat(userId)),
    );

    await prisma.$transaction([
      prisma.myTeamMember.deleteMany({ where: { teamId } }),
      prisma.teamInvite.deleteMany({ where: { teamId } }),
      prisma.myTeam.delete({ where: { id: teamId } }),
      prisma.user.updateMany({
        where: { id: { in: userIdsToReset } },
        data: { inTeam: false },
      }), // Fix: update EVERYONE, not just the owner
    ]);

    // ── CACHE & GLOBAL POOL SYNC ──
    await bustCache(...userIdsToReset.map((id) => cacheKey.myTeam(id)));

    await Promise.all(
      userIdsToReset.map(async (id) => {
        await updateAthleteInPool(id, { inTeam: false });
        await syncUserSessionInTeam(id, false);
      }),
    );

    return { success: true, error: false, message: "Team deleted", data: null };
  } catch (error) {
    return {
      success: false,
      error: true,
      message: error instanceof Error ? error.message : "Failed to delete team",
      data: null,
    };
  }
}
