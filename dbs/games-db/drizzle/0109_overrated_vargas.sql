ALTER TABLE "ReferrerTransaction" ALTER COLUMN "id" DROP IDENTITY;
ALTER TABLE "ReferrerTransaction" ALTER COLUMN "id" SET DATA TYPE uuid USING (uuid_generate_v7());--> statement-breakpoint
ALTER TABLE "ReferrerTransaction" ALTER COLUMN "id" SET DEFAULT uuid_generate_v7();--> statement-breakpoint