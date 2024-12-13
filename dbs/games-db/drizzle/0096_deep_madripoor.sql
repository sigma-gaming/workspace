ALTER TABLE "Deposit" RENAME COLUMN "userAmount" TO "gemAmount";--> statement-breakpoint
ALTER TABLE "Withdrawal" RENAME COLUMN "userAmount" TO "gemAmount";--> statement-breakpoint
ALTER TABLE "Withdrawal" RENAME COLUMN "providerAmount" TO "currencyAmount";