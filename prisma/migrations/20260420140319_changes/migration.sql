/*
  Warnings:

  - You are about to drop the column `discipline` on the `AthleteProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[teamId,role]` on the table `MyTeamMember` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,toUserId,role]` on the table `TeamInvite` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `role` on the `MyTeamMember` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `role` on the `TeamInvite` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('SWIMMER', 'CYCLIST', 'RUNNER');

-- DropIndex
DROP INDEX "MyTeamMember_teamId_userId_key";

-- DropIndex
DROP INDEX "TeamInvite_teamId_toUserId_key";

-- AlterTable
ALTER TABLE "AthleteProfile" DROP COLUMN "discipline",
ADD COLUMN     "disciplines" "Discipline"[];

-- AlterTable
ALTER TABLE "MyTeamMember" DROP COLUMN "role",
ADD COLUMN     "role" "Discipline" NOT NULL;

-- AlterTable
ALTER TABLE "TeamInvite" DROP COLUMN "role",
ADD COLUMN     "role" "Discipline" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MyTeamMember_teamId_role_key" ON "MyTeamMember"("teamId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_teamId_toUserId_role_key" ON "TeamInvite"("teamId", "toUserId", "role");
