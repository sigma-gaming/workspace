ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_User_id_fk";
--> statement-breakpoint
ALTER TABLE "Transaction" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Promocode" ADD COLUMN "createdBy" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Promocode" ADD CONSTRAINT "Promocode_createdBy_User_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
