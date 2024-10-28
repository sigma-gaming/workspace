ALTER TABLE "Session" DROP CONSTRAINT "Session_token_unique";--> statement-breakpoint
ALTER TABLE "Session" DROP COLUMN IF EXISTS "token";