DO $$ BEGIN
 CREATE TYPE "public"."GlobalTaskKey" AS ENUM('VkGroupSubscribe', 'VkPinnedRepost', 'TelegramGroupSubscribe');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."TaskStatus" AS ENUM('Pending', 'Completed', 'Claimed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."TaskType" AS ENUM('Global', 'Personal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "GlobalTaskStatus" (
	"taskKey" "GlobalTaskKey" NOT NULL,
	"userId" uuid NOT NULL,
	"status" "TaskStatus" NOT NULL,
	CONSTRAINT "GlobalTaskStatus_taskKey_userId_pk" PRIMARY KEY("taskKey","userId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "GlobalTask" (
	"key" "GlobalTaskKey" PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"requirements" json NOT NULL,
	"reward" bigint NOT NULL,
	"wageringMultiplier" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "GameRecord" ALTER COLUMN "transactionId" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "ChatMessage" ADD COLUMN "isPinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GlobalTaskStatus" ADD CONSTRAINT "GlobalTaskStatus_taskKey_GlobalTask_key_fk" FOREIGN KEY ("taskKey") REFERENCES "public"."GlobalTask"("key") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "GlobalTaskStatus" ADD CONSTRAINT "GlobalTaskStatus_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ChatMessage_isPinned_index" ON "ChatMessage" USING btree ("isPinned") WHERE "ChatMessage"."isPinned" = true;