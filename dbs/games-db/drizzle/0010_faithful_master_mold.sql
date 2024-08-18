DO $$ BEGIN
 CREATE TYPE "public"."PromocodeBonusType" AS ENUM('DepositMultiplier', 'DepositFixed', 'Payout');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "TransactionType" ADD VALUE 'Bonus';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PromocodeUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"promocodeId" uuid,
	"userId" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Promocode" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone,
	"code" text NOT NULL,
	"wageringMultiplier" integer NOT NULL,
	"usages" integer NOT NULL,
	"maxUsages" integer NOT NULL,
	"isActive" boolean NOT NULL,
	"bonusType" "PromocodeBonusType" NOT NULL,
	"bonus" json NOT NULL,
	"userId" uuid
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PromocodeUsage" ADD CONSTRAINT "PromocodeUsage_promocodeId_Promocode_id_fk" FOREIGN KEY ("promocodeId") REFERENCES "public"."Promocode"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "PromocodeUsage" ADD CONSTRAINT "PromocodeUsage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Promocode" ADD CONSTRAINT "Promocode_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
