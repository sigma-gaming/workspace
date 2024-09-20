import { integer, pgTable, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from './user'

export const ReferrerSettingsTable = pgTable('ReferrerSettings', {
  referrerId: uuid('referrerId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .primaryKey(),
  referralLossShare: integer('referralLossShare').notNull().default(10),
})

export type ReferrerSettingsSelect = typeof ReferrerSettingsTable.$inferSelect
export type ReferrerSettingsInsert = typeof ReferrerSettingsTable.$inferInsert
