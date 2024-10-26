ALTER TABLE "Session" RENAME COLUMN "token" TO "refreshToken";--> statement-breakpoint
ALTER TABLE "Session" DROP CONSTRAINT "Session_token_unique";--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_refreshToken_unique" UNIQUE("refreshToken");