ALTER TABLE "GlobalTaskStatus" DROP CONSTRAINT "GlobalTaskStatus_userId_User_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GlobalTaskStatus" ADD CONSTRAINT "GlobalTaskStatus_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "Session" DROP COLUMN IF EXISTS "preventAutoDelete";