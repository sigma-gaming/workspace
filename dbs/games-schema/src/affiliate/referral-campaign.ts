import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { uuidv7 } from '../lib/sql'
import { UserTable } from '../user/user'

export const ReferralCampaignTable = pgTable('referral_campaign', {
  id: uuid('id').primaryKey().default(uuidv7),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  name: text('name').notNull(),

  code: text('code').unique().notNull(),

  totalVisits: integer('total_visits').notNull().default(0),
  totalSignups: integer('total_signups').notNull().default(0),

  referrerId: uuid('referrer_id').references(() => UserTable.id, {
    onDelete: 'cascade',
  }),
})

export type ReferralCampaignSelect = typeof ReferralCampaignTable.$inferSelect
export type ReferralCampaignInsert = typeof ReferralCampaignTable.$inferInsert
