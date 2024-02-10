ALTER TABLE "Notifications" DROP CONSTRAINT "Notifications_pkey";
ALTER TABLE "Notifications" DROP COLUMN IF EXISTS id;
ALTER TABLE "Notifications" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;