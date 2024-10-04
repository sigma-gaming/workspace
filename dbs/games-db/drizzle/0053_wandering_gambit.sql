CREATE TABLE IF NOT EXISTS "UserStats" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"totalBet" bigint DEFAULT 0 NOT NULL,
	"totalWin" bigint DEFAULT 0 NOT NULL,
	"totalLost" bigint DEFAULT 0 NOT NULL,
	"totalBetCount" integer DEFAULT 0 NOT NULL,
	"maxWin" bigint DEFAULT 0 NOT NULL,
	"maxWinGameId" bigint,
	"maxMultiplier" integer DEFAULT 0 NOT NULL,
	"maxMultiplierGameId" bigint
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_maxWinGameId_GameRecord_id_fk" FOREIGN KEY ("maxWinGameId") REFERENCES "public"."GameRecord"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_maxMultiplierGameId_GameRecord_id_fk" FOREIGN KEY ("maxMultiplierGameId") REFERENCES "public"."GameRecord"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
