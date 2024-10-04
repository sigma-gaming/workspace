ALTER TABLE "Balance" ADD COLUMN "totalBetCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Balance" ADD COLUMN "maxWin" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Balance" ADD COLUMN "maxMultiplier" integer DEFAULT 0 NOT NULL;