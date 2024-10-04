ALTER TABLE "ReferrerSettings" RENAME COLUMN "referralLossShare" TO "revShare";--> statement-breakpoint
ALTER TABLE "ReferrerPayout" ADD COLUMN "lastPayoutAt" timestamp;