DO $$ BEGIN
 CREATE TYPE "public"."Currency" AS ENUM('RUB', 'KZT', 'USD', 'EUR', 'TRX', 'USDT_TRC20', 'USDT_ERC20', 'BTC', 'LTC', 'TON', 'NOT', 'ETH', 'BNB', 'DOGE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."DepositMethod" AS ENUM('SBP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."PaymentProvider" AS ENUM('Bovapay');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."PaymentStatus" AS ENUM('Pending', 'Completed', 'Failed', 'Expired', 'Cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."WithdrawalMethod" AS ENUM('SBP');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Deposit" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "PaymentStatus" NOT NULL,
	"userAmount" bigint NOT NULL,
	"providerAmount" bigint NOT NULL,
	"method" "DepositMethod" NOT NULL,
	"currency" "Currency" NOT NULL,
	"provider" "PaymentProvider" NOT NULL,
	"providerPayload" jsonb NOT NULL,
	"userId" uuid NOT NULL,
	"transactionId" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Withdrawal" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"userAmount" bigint NOT NULL,
	"providerAmount" bigint NOT NULL,
	"status" "PaymentStatus" NOT NULL,
	"currency" "Currency" NOT NULL,
	"method" "WithdrawalMethod" NOT NULL,
	"provider" "PaymentProvider" NOT NULL,
	"providerPayload" jsonb NOT NULL,
	"userId" uuid NOT NULL,
	"transactionId" bigint
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Deposit" ADD CONSTRAINT "Deposit_transactionId_Transaction_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_transactionId_Transaction_id_fk" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
