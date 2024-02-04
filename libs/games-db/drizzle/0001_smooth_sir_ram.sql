ALTER TABLE "Transactions" ADD COLUMN "totalBet" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Transactions" ADD COLUMN "totalWin" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Transactions" ADD COLUMN "totalLost" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Transactions" ADD COLUMN "totalRTP" bigint DEFAULT 0 NOT NULL;