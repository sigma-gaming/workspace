-- Drop foreign keys first
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_referralCampaignId_ReferralCampaign_id_fk";
ALTER TABLE "ReferrerTransaction" DROP CONSTRAINT IF EXISTS "ReferrerTransaction_referralCampaignId_ReferralCampaign_id_fk";

-- Add temporary column to store old IDs
ALTER TABLE "ReferralCampaign" ADD COLUMN "old_id" BIGINT;

-- Store current IDs before conversion
UPDATE "ReferralCampaign" SET "old_id" = "id"::bigint;

-- Update references to store old IDs temporarily
ALTER TABLE "Session" ADD COLUMN "old_referralCampaignId" BIGINT;
ALTER TABLE "User" ADD COLUMN "old_referralCampaignId" BIGINT;
ALTER TABLE "ReferrerTransaction" ADD COLUMN "old_referralCampaignId" BIGINT;

UPDATE "Session"
SET "old_referralCampaignId" = "referralCampaignId"::bigint
WHERE "referralCampaignId" IS NOT NULL;

UPDATE "User"
SET "old_referralCampaignId" = "referralCampaignId"::bigint
WHERE "referralCampaignId" IS NOT NULL;

UPDATE "ReferrerTransaction"
SET "old_referralCampaignId" = "referralCampaignId"::bigint
WHERE "referralCampaignId" IS NOT NULL;

-- Convert ReferralCampaign id to UUID
ALTER TABLE "ReferralCampaign" ALTER COLUMN "id" DROP IDENTITY;
ALTER TABLE "ReferralCampaign" ALTER COLUMN "id" SET DATA TYPE uuid USING (uuid_generate_v7());
ALTER TABLE "ReferralCampaign" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();

-- Convert reference columns to UUID with explicit casting
ALTER TABLE "Session" ALTER COLUMN "referralCampaignId" SET DATA TYPE uuid USING (NULL);
ALTER TABLE "User" ALTER COLUMN "referralCampaignId" SET DATA TYPE uuid USING (NULL);
ALTER TABLE "ReferrerTransaction" ALTER COLUMN "referralCampaignId" SET DATA TYPE uuid USING (NULL);

-- Update references with new UUIDs
UPDATE "Session" s
SET "referralCampaignId" = rc.id
FROM "ReferralCampaign" rc
WHERE s."old_referralCampaignId" = rc."old_id";

UPDATE "User" u
SET "referralCampaignId" = rc.id
FROM "ReferralCampaign" rc
WHERE u."old_referralCampaignId" = rc."old_id";

UPDATE "ReferrerTransaction" rt
SET "referralCampaignId" = rc.id
FROM "ReferralCampaign" rc
WHERE rt."old_referralCampaignId" = rc."old_id";

-- Recreate foreign keys
ALTER TABLE "Session" ADD CONSTRAINT "Session_referralCampaignId_ReferralCampaign_id_fk"
    FOREIGN KEY ("referralCampaignId") REFERENCES "ReferralCampaign"("id") ON DELETE SET NULL;
ALTER TABLE "ReferrerTransaction" ADD CONSTRAINT "ReferrerTransaction_referralCampaignId_ReferralCampaign_id_fk"
    FOREIGN KEY ("referralCampaignId") REFERENCES "ReferralCampaign"("id") ON DELETE SET NULL;

-- Clean up temporary columns
ALTER TABLE "Session" DROP COLUMN "old_referralCampaignId";
ALTER TABLE "User" DROP COLUMN "old_referralCampaignId";
ALTER TABLE "ReferrerTransaction" DROP COLUMN "old_referralCampaignId";
ALTER TABLE "ReferralCampaign" DROP COLUMN "old_id";