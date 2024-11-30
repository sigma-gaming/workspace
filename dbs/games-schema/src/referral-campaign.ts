import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from './user'

export const ReferralCampaignTable = pgTable('ReferralCampaign', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
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
