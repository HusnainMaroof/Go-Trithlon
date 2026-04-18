export interface setProfilePayload {
  displayName: string;
  locationCity: string;
  discipline: Discipline[];
  swimTime100m: number | null;
  cycleTime10km: number | null;
  runTime5km: number | null;
  experienceLevel: ExperienceLevel  ;
  trainingDaysPerWeek: number | null;
  competitionLevel: CompetitionLevel ;
}
export enum Discipline {
  SWIMMER = "SWIMMER",
  CYCLIST = "CYCLIST",
  RUNNER = "RUNNER",
}

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
