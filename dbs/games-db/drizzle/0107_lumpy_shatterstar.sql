ALTER TABLE "Deposit" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "Deposit" ALTER COLUMN "id" SET DATA TYPE uuid USING (uuid_generate_v7());--> statement-breakpoint
ALTER TABLE "Deposit" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "Withdrawal" ALTER COLUMN "id" DROP IDENTITY;
ALTER TABLE "Withdrawal" ALTER COLUMN "id" SET DATA TYPE uuid USING (uuid_generate_v7());--> statement-breakpoint
ALTER TABLE "Withdrawal" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
