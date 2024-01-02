/*
  Warnings:

  - You are about to drop the column `providerUserName` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "providerUserName",
ADD COLUMN     "providerUserFirstName" TEXT,
ADD COLUMN     "providerUserLastName" TEXT,
ADD COLUMN     "providerUsername" TEXT;
