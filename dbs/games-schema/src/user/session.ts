import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { ReferralCampaignTable } from '../affiliate/referral-campaign'
import { accountProviderEnum } from '../enums'
import { uuidv7 } from '../lib/sql'
import { UserTable } from './user'

export const SessionTable = pgTable('Session', {
  id: uuid('id').primaryKey().default(uuidv7),
  expiresAt: timestamp('expiresAt', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
  provider: accountProviderEnum('provider').notNull(),
  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  referrerId: uuid('referrerId').references(() => UserTable.id, {
    onDelete: 'set null',
  }),
  referralCampaignId: uuid('referralCampaignId').references(
    () => ReferralCampaignTable.id,
    { onDelete: 'set null' },
  ),
})

export type SessionSelect = typeof SessionTable.$inferSelect
