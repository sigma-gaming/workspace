import { sql } from 'drizzle-orm'
import { bigint, integer, pgTable, timestamp } from 'drizzle-orm/pg-core'

export const BudgetTable = pgTable('budget', {
  id: integer('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  available: bigint('available', { mode: 'number' })
    .notNull()
    .default(100_000_00),
})

export type BudgetSelect = typeof BudgetTable.$inferSelect
