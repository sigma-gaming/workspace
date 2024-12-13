CREATE TABLE IF NOT EXISTS "UserStats" (
	"userId" uuid PRIMARY KEY NOT NULL,
	"depositCount" integer DEFAULT 0 NOT NULL,
	"withdrawCount" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserStats" ADD CONSTRAINT "UserStats_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

INSERT INTO "UserStats" ("userId") SELECT id FROM "User";