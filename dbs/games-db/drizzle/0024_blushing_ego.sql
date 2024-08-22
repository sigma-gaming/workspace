ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_pkey" CASCADE;
ALTER TABLE "Transaction" RENAME COLUMN "id" TO "oldId";
ALTER TABLE "Transaction" RENAME COLUMN "idn" TO "id";
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id");
ALTER TABLE "GameRecord" ADD COLUMN "transactionIdNew" integer;

-- 2. Set "transactionIdNew" in the GameRecord table
UPDATE "GameRecord" r
SET "transactionIdNew" = t.id
FROM "Transaction" t
WHERE r."transactionId" = t."oldId";

-- 3. Drop the old UUID primary key constraint
ALTER TABLE "Transaction" DROP COLUMN "oldId";

-- 4. Drop the "transactionId" column from the GameRecord table
ALTER TABLE "GameRecord" DROP COLUMN "transactionId";

-- 5. Rename the "transactionIdNew" column to "transactionId"
ALTER TABLE "GameRecord" RENAME COLUMN "transactionIdNew" TO "transactionId";

-- 6. Update the foreign key constraint in the GameRecord table to reference the new "transactionId" column
ALTER TABLE "GameRecord" ADD CONSTRAINT "GameRecord_transaction_id_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction" (id);