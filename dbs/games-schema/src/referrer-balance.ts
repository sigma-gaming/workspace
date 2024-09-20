import { bigint, pgTable, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from './user'

export const ReferrerBalanceTable = pgTable('ReferrerBalance', {
  referrerId: uuid('referrerId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .primaryKey(),
  available: bigint('available', { mode: 'number' }).notNull().default(0),
})

export type ReferrerBalanceSelect = typeof ReferrerBalanceTable.$inferSelect
export type ReferrerBalanceInsert = typeof ReferrerBalanceTable.$inferInsert
