// type/dashboardtype.ts

import {
  CompetitionLevel,
  Discipline,
  ExperienceLevel,
} from "../generated/prisma/enums";

export { CompetitionLevel, Discipline, ExperienceLevel };

// ─── Race Distances per discipline ───────────────────────────────────────────

export const RUNNER_DISTANCES = [
  "5K",
  "10K",
  "Half Marathon",
  "Full Marathon",
] as const;

export const SWIMMER_DISTANCES = ["750m", "1500m", "5K Open Water"] as const;

export const CYCLIST_DISTANCES = ["20K", "40K", "90K", "180K"] as const;

export type RunnerDistance = (typeof RUNNER_DISTANCES)[number];
export type SwimmerDistance = (typeof SWIMMER_DISTANCES)[number];
export type CyclistDistance = (typeof CYCLIST_DISTANCES)[number];
export type RaceDistance = RunnerDistance | SwimmerDistance | CyclistDistance;

// ─── Race Result ──────────────────────────────────────────────────────────────

export type RaceResultInput = {
  discipline: Discipline;
  distance: RaceDistance;
  /** Stored in seconds. Convert MM:SS → seconds before sending. */
  timeSeconds: number;
};

// ─── Achievement ──────────────────────────────────────────────────────────────

export type AchievementInput = {
  title: string;
  description?: string;
};

// ─── Server action payload ────────────────────────────────────────────────────

export type setProfilePayload = {
  displayName: string;
  locationCity: string;
  disciplines: Discipline[];
  experienceLevel: ExperienceLevel;
  raceResults: RaceResultInput[];
  achievements: AchievementInput[];
  trainingDaysPerWeek: number | null;
  competitionLevel: CompetitionLevel | null;
};

// ─── Action response ──────────────────────────────────────────────────────────

export type ActionResponse = {
  success: boolean;
  error: boolean;
  message: string | null;
  data: unknown;
};
