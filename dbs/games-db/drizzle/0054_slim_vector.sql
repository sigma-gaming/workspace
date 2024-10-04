ALTER TABLE "UserStats" DROP CONSTRAINT "UserStats_maxWinGameId_GameRecord_id_fk";
--> statement-breakpoint
ALTER TABLE "UserStats" DROP CONSTRAINT "UserStats_maxMultiplierGameId_GameRecord_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_maxWinGameId_GameRecord_id_fk" FOREIGN KEY ("maxWinGameId") REFERENCES "public"."GameRecord"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_maxMultiplierGameId_GameRecord_id_fk" FOREIGN KEY ("maxMultiplierGameId") REFERENCES "public"."GameRecord"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
