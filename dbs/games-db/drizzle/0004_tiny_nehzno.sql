DO $$ BEGIN
 CREATE TYPE "ChatMessageType" AS ENUM('UserMessage', 'SystemMessage');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ChatMessages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"type" "ChatMessageType" NOT NULL,
	"text" text,
	"attachments" json DEFAULT '[]'::json,
	"userId" uuid
);
--> statement-breakpoint
ALTER TABLE "GlobalSettings" DROP COLUMN IF EXISTS "maintenanceMode";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatMessages" ADD CONSTRAINT "ChatMessages_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
