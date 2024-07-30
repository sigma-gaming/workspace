DO $$ BEGIN
 CREATE TYPE "GameOutcome" AS ENUM('Win', 'Loss');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "GameRecord" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"game" "Game" NOT NULL,
	"outcome" "GameOutcome" NOT NULL,
	"snapshot" json NOT NULL,
	"bet" bigint NOT NULL,
	"multiplier" integer NOT NULL,
	"payout" bigint NOT NULL,
	"previewUserName" text NOT NULL,
	"userId" uuid NOT NULL,
	"transactionId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "gameRecordId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GameRecord" ADD CONSTRAINT "GameRecord_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GameRecord" ADD CONSTRAINT "GameRecord_transactionId_Transaction_id_fk" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
