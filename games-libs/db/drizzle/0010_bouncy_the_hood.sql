ALTER TABLE "ChatMessages" RENAME COLUMN "name" TO "senderName";--> statement-breakpoint
ALTER TABLE "ChatMessages" RENAME COLUMN "username" TO "senderUsername";--> statement-breakpoint
ALTER TABLE "ChatMessages" RENAME COLUMN "image" TO "senderImage";--> statement-breakpoint
ALTER TABLE "ChatMessages" ADD COLUMN "senderRoles" "UserRole"[];--> statement-breakpoint
ALTER TABLE "ChatMessages" DROP COLUMN IF EXISTS "roles";