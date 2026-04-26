/*
  Warnings:

  - You are about to drop the column `cycleTime10km` on the `AthleteProfile` table. All the data in the column will be lost.
  - You are about to drop the column `runTime5km` on the `AthleteProfile` table. All the data in the column will be lost.
  - You are about to drop the column `swimTime100m` on the `AthleteProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AthleteProfile" DROP COLUMN "cycleTime10km",
DROP COLUMN "runTime5km",
DROP COLUMN "swimTime100m";
