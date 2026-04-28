"use server";

import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import setRedis from "../lib/redis";
import { catchErrors } from "../utlis/ErrorWrapper";
import { getAuthSession } from "../utlis/helper";
import { ActionResponse } from "./dashboardAction";

type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";

const ALL_DISCIPLINES: Discipline[] = ["SWIMMER", "CYCLIST", "RUNNER"];

// ─── SCORING ─────────────────────────────────────────────────────────────────

const EXPERIENCE_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const MAX_RAW_SCORE = 40 + 20 + 20 + 15 + 5; // 100

function computeMatchScore(
  candidate: any,
  myAthleteData: any,
  missingDisciplines: Discipline[],
): number {
  const a = candidate.athleteData;
  if (!a || !myAthleteData) return 0;

  let score = 0;

  // Discipline relevance
  const candidateDisciplines: string[] = a.disciplines ?? [];
  const relevantCount = candidateDisciplines.filter((d: string) =>
    missingDisciplines.includes(d as Discipline),
  ).length;
  score += relevantCount * 40;

  // Same city (case-insensitive)
  if (
    a.locationCity &&
    myAthleteData.locationCity &&
    a.locationCity.trim().toLowerCase() ===
      myAthleteData.locationCity.trim().toLowerCase()
  ) {
    score += 20;
  }

  // Experience level proximity
  const myLevel = EXPERIENCE_ORDER.indexOf(myAthleteData.experienceLevel ?? "");
  const theirLevel = EXPERIENCE_ORDER.indexOf(a.experienceLevel ?? "");
  if (myLevel !== -1 && theirLevel !== -1) {
    const diff = Math.abs(myLevel - theirLevel);
    score += diff === 0 ? 20 : diff === 1 ? 10 : 0;
  }

  // Training days proximity
  if (myAthleteData.trainingDaysPerWeek && a.trainingDaysPerWeek) {
    const diff = Math.abs(
      myAthleteData.trainingDaysPerWeek - a.trainingDaysPerWeek,
    );
    score += diff <= 1 ? 15 : diff <= 2 ? 8 : 0;
  }

  // Same competition level
  if (
    a.competitionLevel &&
    myAthleteData.competitionLevel &&
    a.competitionLevel === myAthleteData.competitionLevel
  ) {
    score += 5;
  }

  // Normalize to percentage, cap at 100
  return Math.min(Math.round((score / MAX_RAW_SCORE) * 100), 100);
}

// ─── SUGGESTION FETCH (REWRITTEN FOR PRISMA) ─────────────────────────────────

async function getSuggestedAthletes(
  userId: string,
  team: any | null,
  athleteData: any | null,
): Promise<any[]> {
  // 1. Determine which discipline slots are still open
  const filledDisciplines = new Set<string>(
    (team?.members ?? []).map((m: any) => m.role),
  );

  const missingDisciplines = ALL_DISCIPLINES.filter(
    (d) => !filledDisciplines.has(d),
  );

  // Team is full — no suggestions needed
  if (missingDisciplines.length === 0) return [];

  // 2. UserIds to exclude: self + current team members
  const excludeIds = (team?.members ?? []).map((m: any) => m.userId);
  excludeIds.push(userId); // CRITICAL: Never suggest yourself

  // 3. 🚀 THE FIX: Fetch directly from Prisma
  // This completely bypasses Redis expiration desyncs. It strictly finds onboarded athletes
  // who are NOT in a team, NOT in your exclude list, and match the missing disciplines.
  const candidatesFromDb = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      inTeam: false,
      is_Onboard: true,
      athleteProfile: {
        disciplines: {
          hasSome: missingDisciplines, // Native Postgres array intersection!
        },
      },
    },
    include: {
      athleteProfile: {
        include: {
          raceResults: true,
          achievements: true,
        },
      },
    },
  });

  // 4. Format the DB results to exactly match the frontend's expected interface
  const formattedCandidates = candidatesFromDb.map((user) => ({
    userToken: user.userToken,
    email: user.email,
    inTeam: user.inTeam,
    isOnboard: user.is_Onboard,
    profileImage: user.profileImage,
    athleteData: user.athleteProfile,
  }));

  // 5. Score, sort descending, take top 6
  return formattedCandidates
    .map((athlete) => ({
      ...athlete,
      matchScore: computeMatchScore(athlete, athleteData, missingDisciplines),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);
}

// ─── MAIN ACTION ─────────────────────────────────────────────────────────────

export const getMainDashboardData = catchErrors(
  async (_prevState: ActionResponse): Promise<ActionResponse> => {
    const getUser = await getCurrentUser();
    const sessionId = getUser.authsuccess.data.sessionId;
    const userData = await getAuthSession({ sessionId });

    if (!userData?.data?.userId) {
      return { success: false, error: true, message: "No session", data: null };
    }

    const userId = userData.data.userId;
    const athleteData = userData.data.athleteData;

    // ── Round-trip 1: all three cache reads in parallel ──
    const [cachedTeam, cachedReceived, cachedSent] = await Promise.all([
      setRedis.get(`myteam:${userId}`),
      setRedis.get(`invites:received:pending:${userId}`),
      setRedis.get(`invites:sent:pending:${userId}`),
    ]);

    const parse = <T>(v: unknown): T | null => {
      if (!v) return null;
      return (typeof v === "string" ? JSON.parse(v) : v) as T;
    };

    let team = parse<any>(cachedTeam);
    let received = parse<any[]>(cachedReceived);
    let sent = parse<any[]>(cachedSent);

    // ── Round-trip 2 (conditional): only hit DB for what's missing ──
    const dbPromises: Promise<void>[] = [];

    if (!team) {
      dbPromises.push(
        prisma.myTeam
          .findFirst({
            where: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId: userId } } },
              ],
            },
            include: {
              members: {
                include: { user: { include: { athleteProfile: true } } },
              },
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

    if (!received) {
      dbPromises.push(
        prisma.teamInvite
          .findMany({
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
          })
          .then(async (result) => {
            received = result;
            await setRedis.set(
              `invites:received:pending:${userId}`,
              JSON.stringify(result),
              { ex: 60 * 5 },
            );
          }),
      );
    }

    if (!sent) {
      dbPromises.push(
        prisma.teamInvite
          .findMany({
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
          })
          .then(async (result) => {
            sent = result;
            await setRedis.set(
              `invites:sent:pending:${userId}`,
              JSON.stringify(result),
              { ex: 60 * 5 },
            );
          }),
      );
    }

    if (dbPromises.length > 0) {
      await Promise.all(dbPromises);
    }

    const suggestions = await getSuggestedAthletes(userId, team, athleteData);

    return {
      success: true,
      error: false,
      message: "",
      data: {
        team: team ?? null,
        invites: {
          received: received ?? [],
          sent: sent ?? [],
        },
        suggestions,
      },
    };
  },
);
