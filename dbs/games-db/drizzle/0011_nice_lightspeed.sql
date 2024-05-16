--> statement-breakpoint
ALTER TABLE "Users" RENAME TO "User";--> statement-breakpoint
ALTER TABLE "Accounts" RENAME TO "Account";--> statement-breakpoint
ALTER TABLE "ChatMessages" RENAME TO "ChatMessage";--> statement-breakpoint
ALTER TABLE "Notifications" RENAME TO "Notification";--> statement-breakpoint
ALTER TABLE "Profiles" RENAME TO "Profile";--> statement-breakpoint
ALTER TABLE "Sessions" RENAME TO "Session";--> statement-breakpoint
ALTER TABLE "Transactions" RENAME TO "Transaction";--> statement-breakpoint
ALTER TABLE "Profile" DROP CONSTRAINT "Profiles_username_unique";--> statement-breakpoint
ALTER TABLE "Session" DROP CONSTRAINT "Sessions_token_unique";--> statement-breakpoint
ALTER TABLE "Account" DROP CONSTRAINT "Accounts_userId_Users_id_fk";
--> statement-breakpoint
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessages_userId_Users_id_fk";
--> statement-breakpoint
ALTER TABLE "Notification" DROP CONSTRAINT "Notifications_userId_Users_id_fk";
--> statement-breakpoint
ALTER TABLE "Profile" DROP CONSTRAINT "Profiles_userId_Users_id_fk";
--> statement-breakpoint
ALTER TABLE "Session" DROP CONSTRAINT "Sessions_userId_Users_id_fk";
--> statement-breakpoint
ALTER TABLE "Transaction" DROP CONSTRAINT "Transactions_userId_Users_id_fk";
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
--> statement-breakpoint
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_token_unique" UNIQUE("token");