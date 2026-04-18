/*
  Warnings:

  - The `discipline` column on the `AthleteProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AthleteProfile" ADD COLUMN     "displayName" TEXT,
DROP COLUMN "discipline",
ADD COLUMN     "discipline" TEXT[];

-- DropEnum
DROP TYPE "Discipline";
