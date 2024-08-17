DO $$ BEGIN
 CREATE TYPE "public"."FraudRisk" AS ENUM('Clear', 'Low', 'Medium', 'High');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "risk" "FraudRisk" DEFAULT 'Clear' NOT NULL;--> statement-breakpoint
ALTER TABLE "UserSecurity" ADD COLUMN "whitelisted" boolean DEFAULT false NOT NULL;