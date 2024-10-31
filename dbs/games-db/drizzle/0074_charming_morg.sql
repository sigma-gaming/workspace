ALTER TABLE "UserSecurity" DROP CONSTRAINT "UserSecurity_userId_unique";--> statement-breakpoint
ALTER TABLE "UserSecurity" DROP CONSTRAINT "UserSecurity_pkey";--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD PRIMARY KEY ("userId");--> statement-breakpoint
ALTER TABLE "UserSecurity" ALTER COLUMN "id" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Account_userId_index" ON "Account" USING btree ("userId");