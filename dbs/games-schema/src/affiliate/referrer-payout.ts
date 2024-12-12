import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from '../user/user'

export const ReferrerPayoutTable = pgTable('ReferrerPayout', {
  referrerId: uuid('referrerId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .primaryKey(),
  nextPayoutAt: timestamp('nextPayoutAt').notNull(),
  lastPayoutAt: timestamp('lastPayoutAt'),
})

export type ReferrerPayoutSelect = typeof ReferrerPayoutTable.$inferSelect
export type ReferrerPayoutInsert = typeof ReferrerPayoutTable.$inferInsert
