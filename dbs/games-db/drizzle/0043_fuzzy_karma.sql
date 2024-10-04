CREATE TABLE IF NOT EXISTS "Balance" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"available" bigint DEFAULT 0 NOT NULL,
	"wageringRequired" bigint DEFAULT 0 NOT NULL,
	"totalBet" bigint DEFAULT 0 NOT NULL,
	"totalWin" bigint DEFAULT 0 NOT NULL,
	"totalLost" bigint DEFAULT 0 NOT NULL,
	"totalRTP" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ReferrerTransaction" DROP CONSTRAINT "ReferrerTransaction_referralId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_referrerId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "ReferrerTransaction" ALTER COLUMN "referralId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ReferrerTransaction" ADD COLUMN "referralCampaignId" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Balance" ADD CONSTRAINT "Balance_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferrerTransaction" ADD CONSTRAINT "ReferrerTransaction_referralCampaignId_ReferralCampaign_id_fk" FOREIGN KEY ("referralCampaignId") REFERENCES "public"."ReferralCampaign"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferrerTransaction" ADD CONSTRAINT "ReferrerTransaction_referralId_User_id_fk" FOREIGN KEY ("referralId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "openingBalance";--> statement-breakpoint
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "closingBalance";--> statement-breakpoint
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "wageringRequired";--> statement-breakpoint
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "totalBet";--> statement-breakpoint
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "totalWin";--> statement-breakpoint
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "totalLost";--> statement-breakpoint
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "totalRTP";--> statement-breakpoint
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "referrerId";