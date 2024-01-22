/*
  Warnings:

  - The primary key for the `Budget` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Budget` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Budget" ADD COLUMN "numberId" INTEGER;
UPDATE "Budget" SET "numberId" = 1;
ALTER TABLE "Budget"
ALTER COLUMN "numberId" SET NOT NULL,
DROP CONSTRAINT "Budget_pkey";
ALTER TABLE "Budget" DROP COLUMN "id";
ALTER TABLE "Budget" RENAME COLUMN "numberId" TO "id";
ALTER TABLE "Budget" ADD PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "GlobalSettings" (
    "id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GlobalSettings_pkey" PRIMARY KEY ("id")
);
