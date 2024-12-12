import { bigint, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from '../user/user'

export const ReferrerWithdrawalTable = pgTable('ReferrerWithdrawal', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  amount: bigint('amount', { mode: 'number' }).notNull(),

  referrerId: uuid('referrerId').references(() => UserTable.id, {
    onDelete: 'cascade',
  }),
})

export type ReferrerWithdrawalSelect =
  typeof ReferrerWithdrawalTable.$inferSelect
export type ReferrerWithdrawalInsert =
  typeof ReferrerWithdrawalTable.$inferInsert
