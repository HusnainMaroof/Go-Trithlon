"use server";

import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import { addAthleteToPool } from "../service/getData.service";

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





export const getAllAthlete = catchErrors(async (): Promise<ActionResponse> => {
  // Authenticate — marketplace needs user context for invite + team status
  const getUser = await getCurrentUser();
  const sessionId = getUser.authsuccess.data.sessionId;
  const userData = await getAuthSession({ sessionId });
  const userId = userData?.data?.userId ?? null;

  // Round-trip 1: athlete index + sent invites + team — all parallel
  const [userIds, cachedSent, cachedTeam] = await Promise.all([
    setRedis.lrange("athletes:index", 0, 99),
    userId
      ? setRedis.get(`invites:sent:pending:${userId}`)
      : Promise.resolve(null),
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
            `invites:sent:pending:${userId}`,
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
            await setRedis.set(`myteam:${userId}`, JSON.stringify(result), {
              ex: 60 * 60 * 24 * 7,
            });
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
        pipeline.set(`athletes:user:${uid}`, JSON.stringify(athlete), {
          ex: 60 * 60 * 24 * 7,
        });
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
