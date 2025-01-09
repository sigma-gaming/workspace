import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from '../lib/sql'
import { UserTable } from '../user/user'

export const ReferralCampaignTable = pgTable('ReferralCampaign', {
  id: uuid('id').primaryKey().default(uuidv7),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  name: text('name').notNull(),

  code: text('code').unique().notNull(),

  totalVisits: integer('totalVisits').notNull().default(0),
  totalSignups: integer('totalSignups').notNull().default(0),

  referrerId: uuid('referrerId').references(() => UserTable.id, {
    onDelete: 'cascade',
  }),
})

export type ReferralCampaignSelect = typeof ReferralCampaignTable.$inferSelect
export type ReferralCampaignInsert = typeof ReferralCampaignTable.$inferInsert
