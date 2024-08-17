ALTER TYPE "FraudRisk" ADD VALUE 'Unknown';--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "ipScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "addressTonScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "addressUsdtScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "addressUsdcScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "addressTrxScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "addressEthScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "addressBtcScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "addressLtcScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "addressDogeScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "addressBnbScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "addressXmrScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "addressSolScore" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" DROP COLUMN IF EXISTS "risk";