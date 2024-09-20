import {
  bigint,
  bigserial,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { UserTable } from './user'

export const ReferrerWithdrawalTable = pgTable('ReferrerWithdrawal', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
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
