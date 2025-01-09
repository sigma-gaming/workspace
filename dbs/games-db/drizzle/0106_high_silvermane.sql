-- Drop foreign keys first
ALTER TABLE "Balance" DROP CONSTRAINT IF EXISTS "Balance_maxWinGameId_GameRecord_id_fk";
ALTER TABLE "Balance" DROP CONSTRAINT IF EXISTS "Balance_maxMultiplierGameId_GameRecord_id_fk";

-- Add temporary column to store old IDs
ALTER TABLE "GameRecord" ADD COLUMN "old_id" BIGINT;

-- Store current IDs before conversion
UPDATE "GameRecord" SET "old_id" = "id"::bigint;

-- Update Balance references to store old IDs temporarily
ALTER TABLE "Balance" ADD COLUMN "old_maxWinGameId" BIGINT;
ALTER TABLE "Balance" ADD COLUMN "old_maxMultiplierGameId" BIGINT;
ALTER TABLE "Transaction" ADD COLUMN "old_gameRecordId" BIGINT;

UPDATE "Balance" 
SET "old_maxWinGameId" = "maxWinGameId"::bigint,
    "old_maxMultiplierGameId" = "maxMultiplierGameId"::bigint
WHERE "maxWinGameId" IS NOT NULL OR "maxMultiplierGameId" IS NOT NULL;

UPDATE "Transaction"
SET "old_gameRecordId" = "gameRecordId"::bigint
WHERE "gameRecordId" IS NOT NULL;

-- Convert GameRecord id to UUID
ALTER TABLE "GameRecord" ALTER COLUMN "id" DROP IDENTITY;
ALTER TABLE "GameRecord" ALTER COLUMN "id" SET DATA TYPE uuid USING (uuid_generate_v7());
ALTER TABLE "GameRecord" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- Convert Balance reference columns to UUID with explicit casting
ALTER TABLE "Balance" ALTER COLUMN "maxWinGameId" SET DATA TYPE uuid USING (uuid_generate_v7());
ALTER TABLE "Balance" ALTER COLUMN "maxMultiplierGameId" SET DATA TYPE uuid USING (uuid_generate_v7());
ALTER TABLE "Transaction" ALTER COLUMN "gameRecordId" SET DATA TYPE uuid USING (uuid_generate_v7());

-- Update Balance references with new UUIDs
UPDATE "Balance" b
SET "maxWinGameId" = g.id
FROM "GameRecord" g
WHERE b."old_maxWinGameId" = g."old_id";

UPDATE "Balance" b
SET "maxMultiplierGameId" = g.id
FROM "GameRecord" g
WHERE b."old_maxMultiplierGameId" = g."old_id";

-- Update Transaction references with new UUIDs
UPDATE "Transaction" t
SET "gameRecordId" = g.id
FROM "GameRecord" g
WHERE t."old_gameRecordId" = g."old_id";

-- Recreate foreign keys
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_maxWinGameId_GameRecord_id_fk" 
    FOREIGN KEY ("maxWinGameId") REFERENCES "GameRecord"("id") ON DELETE CASCADE;
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_maxMultiplierGameId_GameRecord_id_fk" 
    FOREIGN KEY ("maxMultiplierGameId") REFERENCES "GameRecord"("id") ON DELETE CASCADE;

-- Clean up temporary columns
ALTER TABLE "Balance" DROP COLUMN "old_maxWinGameId";
ALTER TABLE "Balance" DROP COLUMN "old_maxMultiplierGameId";
ALTER TABLE "Transaction" DROP COLUMN "old_gameRecordId";
ALTER TABLE "GameRecord" DROP COLUMN "old_id";