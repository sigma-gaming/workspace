ALTER TABLE "ChatMessage" ALTER COLUMN "id" DROP IDENTITY;
ALTER TABLE "ChatMessage" ALTER COLUMN "id" SET DATA TYPE uuid USING (uuid_generate_v7());--> statement-breakpoint
ALTER TABLE "ChatMessage" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint