DO $$ BEGIN
 CREATE TYPE "public"."PromocodeUsageStatus" AS ENUM('Applied', 'Pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "PromocodeUsage" ADD COLUMN "status" "PromocodeUsageStatus" NOT NULL;--> statement-breakpoint
ALTER TABLE "PromocodeUsage" ADD COLUMN "expiresAt" timestamp with time zone;