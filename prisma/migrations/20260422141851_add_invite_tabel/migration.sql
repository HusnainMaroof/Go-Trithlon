/*
  Warnings:

  - A unique constraint covering the columns `[teamId,fromUserId,toUserId]` on the table `TeamInvite` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "MyTeam" DROP CONSTRAINT "MyTeam_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "MyTeamMember" DROP CONSTRAINT "MyTeamMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "TeamInvite" DROP CONSTRAINT "TeamInvite_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "TeamInvite" DROP CONSTRAINT "TeamInvite_toUserId_fkey";

-- CreateIndex
CREATE INDEX "TeamInvite_toUserId_status_idx" ON "TeamInvite"("toUserId", "status");

-- CreateIndex
CREATE INDEX "TeamInvite_fromUserId_status_idx" ON "TeamInvite"("fromUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_teamId_fromUserId_toUserId_key" ON "TeamInvite"("teamId", "fromUserId", "toUserId");

-- AddForeignKey
ALTER TABLE "MyTeam" ADD CONSTRAINT "MyTeam_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MyTeamMember" ADD CONSTRAINT "MyTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
