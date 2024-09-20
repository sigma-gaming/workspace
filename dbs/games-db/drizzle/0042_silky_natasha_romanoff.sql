CREATE TABLE IF NOT EXISTS "ReferrerSettings" (
	"referrerId" uuid PRIMARY KEY NOT NULL,
	"referralLossShare" integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "referralCampaignId" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferrerSettings" ADD CONSTRAINT "ReferrerSettings_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_referralCampaignId_ReferralCampaign_id_fk" FOREIGN KEY ("referralCampaignId") REFERENCES "public"."ReferralCampaign"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
