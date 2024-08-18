ALTER TABLE "Promocode" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "Promocode" ADD CONSTRAINT "Promocode_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "Promocode" ADD CONSTRAINT "Promocode_code_unique" UNIQUE("code");