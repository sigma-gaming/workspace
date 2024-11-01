CREATE INDEX IF NOT EXISTS "ReferrerTransaction_referrerId_index" ON "ReferrerTransaction" USING btree ("referrerId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ReferrerTransaction_createdAt_index" ON "ReferrerTransaction" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Transaction_userId_index" ON "Transaction" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Transaction_type_index" ON "Transaction" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_index" ON "Transaction" USING btree ("createdAt");