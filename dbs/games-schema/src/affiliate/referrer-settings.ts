import { integer, pgTable, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from '../user/user'

export const ReferrerSettingsTable = pgTable('referrer_settings', {
  referrerId: uuid('referrer_id')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .primaryKey(),
  revShare: integer('rev_share').notNull().default(10),
})

export type ReferrerSettingsSelect = typeof ReferrerSettingsTable.$inferSelect
export type ReferrerSettingsInsert = typeof ReferrerSettingsTable.$inferInsert
