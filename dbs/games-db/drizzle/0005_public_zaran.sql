CREATE TABLE IF NOT EXISTS "UserSecurity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lastIP" text NOT NULL,
	"addressUsdt" text,
	"addressUsdc" text,
	"addressTrx" text,
	"addressEth" text,
	"addressBtc" text,
	"addressLtc" text,
	"addressTon" text,
	"addressDoge" text,
	"addressBnb" text,
	"addressXmr" text,
	"addressSol" text,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "securityId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserSecurity" ADD CONSTRAINT "UserSecurity_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
