UPDATE "Transaction"
SET "gameRecordId" = NULL
WHERE "gameRecordId" IS NOT NULL
  AND "gameRecordId" NOT IN (SELECT "id" FROM "GameRecord");

DO $$ BEGIN
 ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_gameRecordId_GameRecord_id_fk" FOREIGN KEY ("gameRecordId") REFERENCES "public"."GameRecord"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_profileId_Profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "User" ADD CONSTRAINT "User_securityId_UserSecurity_id_fk" FOREIGN KEY ("securityId") REFERENCES "public"."UserSecurity"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
