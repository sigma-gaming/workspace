ALTER TABLE "Balance" ADD COLUMN "maxWinGameId" bigint;--> statement-breakpoint
ALTER TABLE "Balance" ADD COLUMN "maxMultiplierGameId" bigint;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Balance" ADD CONSTRAINT "Balance_maxWinGameId_GameRecord_id_fk" FOREIGN KEY ("maxWinGameId") REFERENCES "public"."GameRecord"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Balance" ADD CONSTRAINT "Balance_maxMultiplierGameId_GameRecord_id_fk" FOREIGN KEY ("maxMultiplierGameId") REFERENCES "public"."GameRecord"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
