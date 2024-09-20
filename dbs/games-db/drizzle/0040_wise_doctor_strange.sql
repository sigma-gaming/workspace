DO $$ BEGIN
 CREATE TYPE "public"."ReferralAction" AS ENUM('Deposit', 'Loss');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "TransactionType" ADD VALUE 'Transfer';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReferralCampaign" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"totalVisits" integer DEFAULT 0 NOT NULL,
	"totalSignups" integer DEFAULT 0 NOT NULL,
	"referrerId" uuid,
	CONSTRAINT "ReferralCampaign_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReferrerBalance" (
	"referrerId" uuid PRIMARY KEY NOT NULL,
	"available" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReferrerReward" (
	"id" bigint PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"referralAction" "ReferralAction" NOT NULL,
	"periodStart" timestamp with time zone NOT NULL,
	"periodEnd" timestamp with time zone NOT NULL,
	"amount" bigint NOT NULL,
	"referrerId" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ReferrerWithdrawal" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"amount" bigint NOT NULL,
	"referrerId" uuid
);
--> statement-breakpoint
ALTER TABLE "Transaction" ADD COLUMN "referrerId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferralCampaign" ADD CONSTRAINT "ReferralCampaign_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferrerBalance" ADD CONSTRAINT "ReferrerBalance_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferrerReward" ADD CONSTRAINT "ReferrerReward_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ReferrerWithdrawal" ADD CONSTRAINT "ReferrerWithdrawal_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_referrerId_User_id_fk" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
