ALTER TABLE "PromocodeUsage" DROP CONSTRAINT "PromocodeUsage_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "PromocodeUsage" ALTER COLUMN "promocodeId" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PromocodeUsage" ADD CONSTRAINT "PromocodeUsage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
