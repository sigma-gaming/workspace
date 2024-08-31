ALTER TABLE "GlobalTask" RENAME COLUMN "reward" TO "payout";--> statement-breakpoint

ALTER TABLE "GameRecord" RENAME COLUMN "id" TO "oldId";
ALTER TABLE "GameRecord" DROP CONSTRAINT "GameRecord_pkey";
ALTER TABLE "GameRecord" ALTER COLUMN "oldId" DROP NOT NULL;
ALTER TABLE "GameRecord" ADD COLUMN "id" bigserial PRIMARY KEY NOT NULL;

-- Update related table start
ALTER TABLE "Transaction" RENAME COLUMN "gameRecordId" TO "oldGameRecordId";
ALTER TABLE "Transaction" ADD COLUMN "gameRecordId" bigint;
UPDATE "Transaction" tr
SET "gameRecordId" = record.id
FROM "GameRecord" record
WHERE tr."oldGameRecordId" = record."oldId";
ALTER TABLE "Transaction" DROP COLUMN "oldGameRecordId";
-- Update related table end

ALTER TABLE "GameRecord" DROP COLUMN IF EXISTS "oldId";
ALTER TABLE "Transaction" ALTER COLUMN "gameRecordId" SET DATA TYPE bigint;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "GameRecord_userId_index" ON "GameRecord" USING btree ("userId");