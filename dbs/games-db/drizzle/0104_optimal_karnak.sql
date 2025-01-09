ALTER TABLE "ChatMessage" ALTER COLUMN "trackingId" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "Notification" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "Promocode" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "Account" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "Session" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();