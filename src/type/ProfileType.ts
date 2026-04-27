// type/ProfileType.ts
// ─── Single source of truth for all set-profile types ────────────────────────
// Both the action (setprofileAction.ts) and the component (ProfileSetup.tsx)
// import exclusively from here. Delete any old ProfileType or dashboardtype
// that defined setProfilePayload with swimTime100m / cycleTime10km / runTime5km.

import {
  CompetitionLevel,
  Discipline,
  ExperienceLevel,
} from "../generated/prisma/enums";

export { CompetitionLevel, Discipline, ExperienceLevel };

// ─── Race Distances ───────────────────────────────────────────────────────────
// These must stay in sync with the distance strings in the RaceResult schema.
// The Prisma column is String (flexible), but TypeScript enforces this union.

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
  /** Always stored in seconds. The component converts H:MM:SS or MM:SS → seconds before sending. */
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
// message is string | null — NOT optional. The action must always set it
// explicitly so the component can safely read state.message without guards.

export type ActionResponse = {
  success: boolean;
  error: boolean;
  message: string | null;
  data: unknown;
};

export const PAKISTAN_CITIES = [
  "Islamabad",
  "Karachi",
  "Lahore",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Abbottabad",
  "Bahawalpur",
  "Sargodha",
  "Sukkur",
  "Larkana",
  "Sheikhupura",
  "Rahim Yar Khan",
  "Jhang",
  "Gujrat",
  "Mardan",
  "Kasur",
  "Dera Ghazi Khan",
  "Nawabshah",
  "Mingora",
  "Mirpur",
  "Muzaffarabad",
  "Gilgit",
  "Skardu",
  "Turbat",
  "Khuzdar",
  "Hub",
  "Jacobabad",
  "Shikarpur",
  "Okara",
  "Sahiwal",
  "Hafizabad",
  "Wah Cantonment",
  "Attock",
  "Chakwal",
  "Jhelum",
  "Mandi Bahauddin",
  "Narowal",
  "Nankana Sahib",
  "Toba Tek Singh",
  "Vehari",
  "Lodhran",
  "Khanewal",
  "Pakpattan",
  "Bahawalnagar",
];