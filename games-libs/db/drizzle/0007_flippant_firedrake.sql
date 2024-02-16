ALTER TABLE "Accounts" DROP CONSTRAINT "Accounts_userId_Users_id_fk";
--> statement-breakpoint
ALTER TABLE "ChatMessages" DROP CONSTRAINT "ChatMessages_userId_Users_id_fk";
--> statement-breakpoint
ALTER TABLE "Notifications" DROP CONSTRAINT "Notifications_userId_Users_id_fk";
--> statement-breakpoint
ALTER TABLE "Profiles" DROP CONSTRAINT "Profiles_userId_Users_id_fk";
--> statement-breakpoint
ALTER TABLE "Sessions" DROP CONSTRAINT "Sessions_userId_Users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Accounts" ADD CONSTRAINT "Accounts_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ChatMessages" ADD CONSTRAINT "ChatMessages_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Notifications" ADD CONSTRAINT "Notifications_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Profiles" ADD CONSTRAINT "Profiles_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_userId_Users_id_fk" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
