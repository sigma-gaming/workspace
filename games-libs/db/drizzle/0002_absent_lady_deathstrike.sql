DO $$ BEGIN
 CREATE TYPE "NotificationKind" AS ENUM('Success', 'Info', 'Warning', 'Failure');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Notifications" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"kind" "NotificationKind" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"autoClose" boolean NOT NULL,
	"autoCloseMs" integer NOT NULL,
	"withCloseButton" boolean NOT NULL,
	"userId" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
