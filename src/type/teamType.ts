// ─── Enums ────────────────────────────────────────────────────────────────────

export type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";

export enum ExperienceLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export enum CompetitionLevel {
  NONE = "NONE",
  LOCAL = "LOCAL",
  NATIONAL = "NATIONAL",
  PROFESSIONAL = "PROFESSIONAL",
}

// ─── Domain Models ────────────────────────────────────────────────────────────

export interface RaceResultEntry {
  id?: string;
  profileId?: string;
  discipline: string;
  distance: string;
  timeSeconds: number;
}

export interface AchievementEntry {
  id?: string;
  profileId?: string;
  title: string;
  description?: string | null;
}

export interface AthleteProfile {
  id: string;
  userId: string;
  displayName: string | null;
  locationCity: string | null;
  disciplines: Discipline[];
  experienceLevel: ExperienceLevel | string;
  trainingDaysPerWeek: number | null;
  competitionLevel: CompetitionLevel | string | null;
  createdAt: string;
  updatedAt: string;
  raceResults: RaceResultEntry[];
  achievements: AchievementEntry[];
}

export interface TeamMemberUser {
  id: string;
  email: string;
  name: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  userToken: string | null;
  google_id: string | null;
  is_Onboard: boolean;
  inTeam: boolean;
  profileImage: string | null;
  athleteProfile: AthleteProfile | null;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: Discipline;
  joinedAt: string;
  user: TeamMemberUser;
}

export interface Team {
  id: string;
  name: string | null;
  ownerId: string;
  status: "OPEN" | "COMPLETE";
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
}

// ─── Action Response ──────────────────────────────────────────────────────────

export interface ActionResponse<T = unknown> {
  success: boolean;
  error: boolean;
  message: string;
  data: T | null;
}

// ─── Action Payloads ──────────────────────────────────────────────────────────

export type TeamActionPayload =
  | { service: "GET_TEAM" }
  | { service: "CREATE_TEAM"; teamName: string }
  | { service: "CLAIM_SLOT"; role: Discipline; teamId: string }
  | { service: "REMOVE_FROM_TEAM"; memberId: string; teamId: string }
  | { service: "DELETE_TEAM"; teamId: string };

export type SendInvitePayload = {
  toUserId: string;
  role: Discipline;
};

export type AcceptInvitePayload = {
  inviteId: string;
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface SetProfilePayload {
  displayName: string;
  locationCity: string;
  disciplines: Discipline[];
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number | null;
  competitionLevel: CompetitionLevel;
}

// ─── Session Athlete Data ─────────────────────────────────────────────────────
// Matches the Prisma scalar shape returned by getAuthSession / context.
// Dates come back as Date objects (not strings), and relations like
// raceResults / achievements are included only when the session query
// fetches them. Use this type for the `user.athleteData` cast in components.

export interface SessionAthleteData {
  id: string;
  userId: string;
  displayName: string | null;
  locationCity: string | null;
  disciplines: Discipline[];
  experienceLevel: ExperienceLevel | string;
  trainingDaysPerWeek: number | null;
  competitionLevel: CompetitionLevel | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  raceResults: RaceResultEntry[];
  achievements: AchievementEntry[];
}

// ─── UI / Roster ──────────────────────────────────────────────────────────────

export type RosterEntry = {
  memberId: string | null;
  role: string;
  discipline: Discipline;
  filled: boolean;
  name: string | null;
  isMe: boolean;
  hasSkill: boolean;
  img: string | null;
};


