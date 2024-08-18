ALTER TABLE "Promocode" RENAME COLUMN "name" TO "campaign";--> statement-breakpoint
ALTER TABLE "Promocode" DROP CONSTRAINT "Promocode_name_unique";