ALTER TYPE "ReferralAction" ADD VALUE 'Withdrawal';--> statement-breakpoint
ALTER TABLE "ReferrerReward" RENAME TO "ReferrerTransaction";--> statement-breakpoint
ALTER TABLE "ReferrerTransaction" DROP CONSTRAINT "ReferrerReward_referrerId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "ReferrerTransaction" ALTER COLUMN "referrerId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "ReferrerTransaction" ADD COLUMN "isProcessed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ReferrerTransaction" ADD COLUMN "referralId" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferrerTransaction" ADD CONSTRAINT "ReferrerTransaction_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferrerTransaction" ADD CONSTRAINT "ReferrerTransaction_referralId_User_id_fk" FOREIGN KEY ("referralId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "ReferrerTransaction" DROP COLUMN IF EXISTS "periodStart";--> statement-breakpoint
ALTER TABLE "ReferrerTransaction" DROP COLUMN IF EXISTS "periodEnd";