CREATE TABLE IF NOT EXISTS "ReferrerPayout" (
	"referrerId" uuid PRIMARY KEY NOT NULL,
	"nextPayoutAt" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferrerPayout" ADD CONSTRAINT "ReferrerPayout_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
