ALTER TABLE "PromocodeUsage" DROP CONSTRAINT "PromocodeUsage_userId_User_id_fk";
--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'PromocodeUsage'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

ALTER TABLE "PromocodeUsage" DROP CONSTRAINT "PromocodeUsage_pkey";--> statement-breakpoint
ALTER TABLE "PromocodeUsage" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "PromocodeUsage" ADD CONSTRAINT "PromocodeUsage_promocodeId_userId_pk" PRIMARY KEY("promocodeId","userId");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PromocodeUsage" ADD CONSTRAINT "PromocodeUsage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
