export interface setProfilePayload {
  displayName: string;
  locationCity: string;
  disciplines: Discipline[];
  swimTime100m: number | null;
  cycleTime10km: number | null;
  runTime5km: number | null;
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number | null;
  competitionLevel: CompetitionLevel;
}

export type Discipline = "SWIMMER" | "CYCLIST" | "RUNNER";

export type TeamActionPayload =
  | { service: "GET_TEAM" }
  | { service: "CREATE_TEAM"; teamName: string }
  | { service: "CLAIM_SLOT"; role: Discipline; teamId: string }
  | { service: "REMOVE_FROM_TEAM"; memberId: string; teamId: string }
  | { service: "DELETE_TEAM"; teamId: string };
export type DisciplinePayload = "SWIMMER" | "CYCLIST" | "RUNNER";

export type sendInvitesPayload = {
  toUserId: string;
  role: "SWIMMER" | "CYCLIST" | "RUNNER";
};

export type acceptInvitePayload = {
  inviteId: string;
};

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
