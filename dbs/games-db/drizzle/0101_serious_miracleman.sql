DO $$ BEGIN
 CREATE TYPE "public"."DomainApp" AS ENUM('GamesApp', 'GamesApi', 'ControlApp');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Domain" (
	"domain" text PRIMARY KEY NOT NULL,
	"app" "DomainApp" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
