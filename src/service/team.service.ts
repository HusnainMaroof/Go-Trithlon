// actions/services/getTeamService.ts

import { ActionResponse } from "../actions/dashboardAction";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";

import { Discipline as PrismaDiscipline } from "../generated/prisma/enums";
import { Discipline } from "../type/dashboardtype";

const CACHE_TTL = 60 * 60 * 24 * 7;
const VALID_DISCIPLINES: PrismaDiscipline[] = [
  PrismaDiscipline.SWIMMER,
  PrismaDiscipline.CYCLIST,
  PrismaDiscipline.RUNNER,
];

// get Team Service

export const getTeamService = async (
  userId: string,
): Promise<ActionResponse> => {
  const cacheKey = `myteam:${userId}`;

  // 1. Cache hit
  const cached = await setRedis.get(cacheKey);
  if (cached) {
    const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
    return {
      success: true,
      error: false,
      message: "cached team found",
      data: parsed,
    };
  }

  // 2. DB fetch
  const myteam = await prisma.myTeam.findFirst({
    where: { ownerId: userId },
    include: {
      members: {
        include: {
          user: {
            include: { athleteProfile: true },
          },
        },
      },
    },
  });

  if (!myteam)
    return {
      success: false,
      error: true,
      message: "no team",
      data: null,
    };

  // 3. Populate cache
  await setRedis.set(cacheKey, JSON.stringify(myteam), { ex: CACHE_TTL });

  return {
    success: true,
    error: false,
    message: "team found",
    data: myteam,
  };
};
// create team service

export const createTeamService = async (
  userId: string,
  teamName: string,
): Promise<ActionResponse> => {
  const name = teamName.trim();

  if (!name || name.length < 2) {
    return {
      success: false,
      error: true,
      message: "Team name must be at least 2 characters.",
      data: null,
    };
  }

  if (name.length > 50) {
    return {
      success: false,
      error: true,
      message: "Team name must be under 50 characters.",
      data: null,
    };
  }

  const athleteProfile = await prisma.athleteProfile.findUnique({
    where: { userId },
  });

  if (!athleteProfile) {
    return {
      success: false,
      error: true,
      message: "Complete your athlete profile first.",
      data: null,
    };
  }

  const existingTeam = await prisma.myTeam.findFirst({
    where: { ownerId: userId },
  });

  if (existingTeam) {
    return {
      success: false,
      error: true,
      message: "You already have a team.",
      data: existingTeam,
    };
  }

  // ✅ IMPORTANT: include members (empty array)
  const team = await prisma.myTeam.create({
    data: {
      name,
      ownerId: userId,
    },
    include: {
      members: true,
    },
  });

  const cacheKey = `myteam:${userId}`;
  await setRedis.set(cacheKey, JSON.stringify(team), { ex: CACHE_TTL });

  return {
    success: true,
    error: false,
    message: "Team created successfully",
    data: team,
  };
};

// add my skill or slot

export const claimSlotService = async (
  userId: string,
  teamId: string,
  role: Discipline,
  athleteData: {
    id: string;
    displayName?: string;
    disciplines?: Discipline[];
    discipline?: Discipline[];
    [key: string]: any;
  } | null,
): Promise<ActionResponse> => {
  // 1. Validate session profile
  if (!athleteData) {
    return {
      success: false,
      error: true,
      message: "Complete your athlete profile first.",
      data: null,
    };
  }

  // 2. Normalize disciplines (handle your mismatch safely)
  const disciplines: Discipline[] =
    athleteData.disciplines || athleteData.discipline || [];

  if (!disciplines.length) {
    return {
      success: false,
      error: true,
      message: "No disciplines found in profile.",
      data: null,
    };
  }

  if (!disciplines.includes(role)) {
    return {
      success: false,
      error: true,
      message: `You don't have ${role} skill.`,
      data: null,
    };
  }

  // 3. Fetch team
  const team = await prisma.myTeam.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) {
    return {
      success: false,
      error: true,
      message: "Team not found.",
      data: null,
    };
  }

  // 4. Check slot availability
  const slotTaken = team.members.some((m) => m.role === role);

  if (slotTaken) {
    return {
      success: false,
      error: true,
      message: `${role} slot already filled.`,
      data: null,
    };
  }

  // 5. Create membership (minimal write)
  const membership = await prisma.myTeamMember.create({
    data: {
      teamId,
      userId,
      role,
    },
  });

  const updateduserData = await prisma.user.updateMany({
    where: { id: userId },
    data: { inTeam: true },
  });

  const enrichedMember = {
    ...membership,
    user: {
      id: userId,
      athleteProfile: athleteData, // ✅ from session
    },
  };

  // 7. Invalidate cache
  await setRedis.del(`myteam:${team.ownerId}`);
  await setRedis.del(`auth_session:${userId}`);

  return {
    success: true,
    error: false,
    message: `${role} slot claimed successfully.`,
    data: enrichedMember,
  };
}; // remove the athlete

export const removeFromTeamService = async (
  userId: string,
  memberId: string,
  teamId: string,
): Promise<ActionResponse> => {
  // 1. Both IDs must be present
  if (!memberId || !teamId)
    return {
      success: false,
      error: true,
      message: "Member ID and Team ID are required.",
      data: null,
    };

  // 2. Fetch team with owner info
  const team = await prisma.myTeam.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team)
    return {
      success: false,
      error: true,
      message: "Team not found.",
      data: null,
    };

  // 3. Find the specific membership row to remove
  const memberRow = team.members.find((m) => m.id === memberId);
  if (!memberRow)
    return {
      success: false,
      error: true,
      message: "That member slot does not exist in this team.",
      data: null,
    };

  // 4. Authorization — only two people can remove a member:
  //    a) The team owner removing anyone
  //    b) The member removing themselves (leaving the team)
  const isOwner = team.ownerId === userId;
  const isRemovingSelf = memberRow.userId === userId;

  if (!isOwner && !isRemovingSelf)
    return {
      success: false,
      error: true,
      message: "You do not have permission to remove this member.",
      data: null,
    };

  // 5. Owner cannot remove themselves via this service
  //    (they should delete/transfer the team instead)
  if (isOwner && memberRow.userId === team.ownerId && !isRemovingSelf)
    return {
      success: false,
      error: true,
      message:
        "Team owner cannot be removed. Transfer or delete the team instead.",
      data: null,
    };

  // 6. Delete the membership row
  await prisma.myTeamMember.delete({
    where: { id: memberId },
  });

  // 7. Bust cache
  const cacheKey = `myteam:${team.ownerId}`;
  await setRedis.del(cacheKey);

  return {
    success: true,
    error: false,
    message: isRemovingSelf
      ? `You left the ${memberRow.role} slot.`
      : `Member removed from the ${memberRow.role} slot.`,
    data: { memberId, teamId, role: memberRow.role },
  };
};

export const deleteTeamService = async (
  userId: string,
  teamId: string,
): Promise<ActionResponse> => {
  const team = await prisma.myTeam.findUnique({ where: { id: teamId } });

  if (!team)
    return {
      success: false,
      error: true,
      message: "Team not found",
      data: null,
    };
  if (team.ownerId !== userId)
    return {
      success: false,
      error: true,
      message: "Only owners can delete the team",
      data: null,
    };
  const updateduserData = await prisma.user.updateMany({
    where: { id: userId },
    data: { inTeam: false },
  });

  await prisma.myTeam.delete({ where: { id: teamId } });
  await setRedis.del(`myteam:${userId}`);
  await setRedis.del(`auth_session:${userId}`);

  return {
    success: true,
    error: false,
    message: "Team deleted successfully",
    data: null,
  };
};
