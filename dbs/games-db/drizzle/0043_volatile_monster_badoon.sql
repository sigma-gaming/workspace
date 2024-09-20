ALTER TABLE "Transaction" ADD COLUMN "referralCampaignId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_referralCampaignId_ReferralCampaign_id_fk" FOREIGN KEY ("referralCampaignId") REFERENCES "public"."ReferralCampaign"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
