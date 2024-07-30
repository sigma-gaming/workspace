DO $$ BEGIN
 CREATE TYPE "AccountProvider" AS ENUM('VK', 'Telegram');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "ChatMessageType" AS ENUM('UserMessage', 'SystemMessage');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "Game" AS ENUM('Dice');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "NotificationKind" AS ENUM('Success', 'Info', 'Warning', 'Failure');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "TransactionType" AS ENUM('Deposit', 'Withdrawal', 'Bet', 'Win', 'Loss');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "UserRole" AS ENUM('User', 'Admin', 'Moderator');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"provider" "AccountProvider" NOT NULL,
	"providerUserId" text NOT NULL,
	"providerUsername" text,
	"providerUserFirstName" text NOT NULL,
	"providerUserLastName" text,
	"providerUserImage" text,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Budget" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSyncAt" timestamp with time zone DEFAULT now() NOT NULL,
	"available" bigint DEFAULT 10000000 NOT NULL,
	"unwantedLoss" bigint DEFAULT 5000000 NOT NULL,
	"maxLoss" bigint DEFAULT 10000000 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ChatMessage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trackingId" uuid DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"type" "ChatMessageType" NOT NULL,
	"text" text,
	"attachments" json DEFAULT '[]'::json,
	"senderName" text,
	"senderUsername" text,
	"senderImage" text,
	"senderRoles" "UserRole"[],
	"userId" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "GlobalSettings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"kind" "NotificationKind" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"autoClose" boolean NOT NULL,
	"autoCloseMs" integer NOT NULL,
	"withCloseButton" boolean NOT NULL,
	"userId" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text,
	"username" text,
	"usedProvider" "AccountProvider" NOT NULL,
	"userId" uuid NOT NULL,
	CONSTRAINT "Profile_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"provider" "AccountProvider" NOT NULL,
	"userId" uuid NOT NULL,
	CONSTRAINT "Session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"type" "TransactionType" NOT NULL,
	"game" "Game",
	"openingBalance" bigint DEFAULT 0 NOT NULL,
	"closingBalance" bigint NOT NULL,
	"amount" bigint NOT NULL,
	"totalBet" bigint DEFAULT 0 NOT NULL,
	"totalWin" bigint DEFAULT 0 NOT NULL,
	"totalLost" bigint DEFAULT 0 NOT NULL,
	"totalRTP" bigint DEFAULT 0 NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"roles" "UserRole"[] DEFAULT '{"User"}' NOT NULL,
	"profileId" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
