ALTER TABLE "Session" RENAME COLUMN "refreshToken" TO "token";--> statement-breakpoint
ALTER TABLE "Session" DROP CONSTRAINT "Session_refreshToken_unique";--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_token_unique" UNIQUE("token");