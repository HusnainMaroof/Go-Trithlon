/*
  Warnings:

  - You are about to drop the column `displayName` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('SWIMMER', 'CYCLIST', 'RUNNER');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "CompetitionLevel" AS ENUM ('NONE', 'LOCAL', 'NATIONAL', 'PROFESSIONAL');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "displayName",
ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "swimTime100m" DOUBLE PRECISION,
    "cycleTime10km" DOUBLE PRECISION,
    "runTime5km" DOUBLE PRECISION,
    "experienceLevel" "ExperienceLevel" NOT NULL,
    "trainingDaysPerWeek" INTEGER,
    "competitionLevel" "CompetitionLevel",
    "locationCity" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AthleteProfile_userId_key" ON "AthleteProfile"("userId");

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
