ALTER TABLE "ChatMessage" ALTER COLUMN "attachments" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "ChatMessage" ALTER COLUMN "attachments" SET DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "GameRecord" ALTER COLUMN "snapshot" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "GlobalTask" ALTER COLUMN "requirements" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "Promocode" ALTER COLUMN "bonus" SET DATA TYPE jsonb;