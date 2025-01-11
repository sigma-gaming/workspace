-- Drop foreign keys first
ALTER TABLE "Deposit" DROP CONSTRAINT IF EXISTS "Deposit_transactionId_Transaction_id_fk";
ALTER TABLE "Withdrawal" DROP CONSTRAINT IF EXISTS "Withdrawal_transactionId_Transaction_id_fk";
ALTER TABLE "GameRecord" DROP CONSTRAINT IF EXISTS "GameRecord_transaction_id_fkey";

-- Add temporary column to store old IDs
ALTER TABLE "Transaction" ADD COLUMN "old_id" BIGINT;

-- Store current IDs before conversion
UPDATE "Transaction" SET "old_id" = "id"::bigint;

-- Update references to store old IDs temporarily
ALTER TABLE "Deposit" ADD COLUMN "old_transactionId" BIGINT;
ALTER TABLE "Withdrawal" ADD COLUMN "old_transactionId" BIGINT;
ALTER TABLE "GameRecord" ADD COLUMN "old_transactionId" BIGINT;

UPDATE "Deposit"
SET "old_transactionId" = "transactionId"::bigint
WHERE "transactionId" IS NOT NULL;

UPDATE "Withdrawal"
SET "old_transactionId" = "transactionId"::bigint
WHERE "transactionId" IS NOT NULL;

UPDATE "GameRecord"
SET "old_transactionId" = "transactionId"::bigint
WHERE "transactionId" IS NOT NULL;

-- Convert Transaction id to UUID
ALTER TABLE "Transaction" ALTER COLUMN "id" DROP IDENTITY;
ALTER TABLE "Transaction" ALTER COLUMN "id" SET DATA TYPE uuid USING (uuid_generate_v7());
ALTER TABLE "Transaction" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- Convert reference columns to UUID with explicit casting
ALTER TABLE "Deposit" ALTER COLUMN "transactionId" SET DATA TYPE uuid USING (NULL);
ALTER TABLE "Withdrawal" ALTER COLUMN "transactionId" SET DATA TYPE uuid USING (NULL);
ALTER TABLE "GameRecord" ALTER COLUMN "transactionId" SET DATA TYPE uuid USING (NULL);

-- Update references with new UUIDs
UPDATE "Deposit" d
SET "transactionId" = t.id
FROM "Transaction" t
WHERE d."old_transactionId" = t."old_id";

UPDATE "Withdrawal" w
SET "transactionId" = t.id
FROM "Transaction" t
WHERE w."old_transactionId" = t."old_id";

UPDATE "GameRecord" g
SET "transactionId" = t.id
FROM "Transaction" t
WHERE g."old_transactionId" = t."old_id";

-- Recreate foreign keys
ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_transactionId_Transaction_id_fk"
    FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE;
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_transactionId_Transaction_id_fk"
    FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE;
ALTER TABLE "GameRecord" ADD CONSTRAINT "GameRecord_transactionId_Transaction_id_fk"
    FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE;

-- Clean up temporary columns
ALTER TABLE "Deposit" DROP COLUMN "old_transactionId";
ALTER TABLE "Withdrawal" DROP COLUMN "old_transactionId";
ALTER TABLE "GameRecord" DROP COLUMN "old_transactionId";
ALTER TABLE "Transaction" DROP COLUMN "old_id";