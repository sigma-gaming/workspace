import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from '../user/user'

export const ReferrerPayoutTable = pgTable('referrer_payout', {
  referrerId: uuid('referrer_id')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .primaryKey(),
  nextPayoutAt: timestamp('next_payout_at').notNull(),
  lastPayoutAt: timestamp('last_payout_at'),
})

export type ReferrerPayoutSelect = typeof ReferrerPayoutTable.$inferSelect
export type ReferrerPayoutInsert = typeof ReferrerPayoutTable.$inferInsert
