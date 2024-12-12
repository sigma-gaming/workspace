DO $$ BEGIN
 CREATE TYPE "public"."DepositType" AS ENUM('Redirect', 'WhiteLabel');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "PaymentStatus" ADD VALUE 'Processing';--> statement-breakpoint
ALTER TYPE "PaymentStatus" ADD VALUE 'Rejected';--> statement-breakpoint
ALTER TABLE "Deposit" RENAME COLUMN "providerPayload" TO "payload";--> statement-breakpoint
ALTER TABLE "Deposit" ALTER COLUMN "providerAmount" SET DATA TYPE numeric(20, 18);--> statement-breakpoint
ALTER TABLE "Withdrawal" ALTER COLUMN "providerAmount" SET DATA TYPE numeric(20, 18);--> statement-breakpoint
ALTER TABLE "Deposit" ADD COLUMN "type" "DepositType" NOT NULL;--> statement-breakpoint
ALTER TABLE "Deposit" ADD COLUMN "providerTransactionId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Withdrawal" ADD COLUMN "providerTransactionId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Withdrawal" DROP COLUMN IF EXISTS "providerPayload";