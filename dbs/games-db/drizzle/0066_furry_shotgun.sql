ALTER TABLE "Session" ADD COLUMN "referrerId" uuid;--> statement-breakpoint
ALTER TABLE "Session" ADD COLUMN "referralCampaignId" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Session" ADD CONSTRAINT "Session_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Session" ADD CONSTRAINT "Session_referralCampaignId_ReferralCampaign_id_fk" FOREIGN KEY ("referralCampaignId") REFERENCES "public"."ReferralCampaign"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
