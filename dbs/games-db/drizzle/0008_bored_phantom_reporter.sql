ALTER TABLE "ChatMessages" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "ChatMessages" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "ChatMessages" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "ChatMessages" ADD COLUMN "roles" "UserRole"[];