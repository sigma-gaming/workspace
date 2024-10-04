ALTER TABLE "ChatMessage" ADD COLUMN "profileId" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_profileId_Profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
