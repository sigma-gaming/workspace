/*
  Warnings:

  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "name" TEXT,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "username";

-- CreateIndex
CREATE UNIQUE INDEX "Profile_username_key" ON "Profile"("username");
