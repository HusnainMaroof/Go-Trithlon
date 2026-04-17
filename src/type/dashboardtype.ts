import { Prisma } from "@prisma/client";

export interface setProfilePayload {
  displayName?: string;
  location: string;
  discipline: Prisma.Discipline;
  experienceLevel: Prisma.ExperienceLevel;
  trainingDays: number | null;
  competitionLevel: Prisma.CompetitionLevel;
}