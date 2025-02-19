import { AccountProvider, UserRole } from '@dbs/games-types'
import { pgTable, smallint, timestamp, uuid } from 'drizzle-orm/pg-core'
import { ReferralCampaignTable } from '../affiliate/referral-campaign'
import { uuidv7 } from '../lib/sql'
import { UserTable } from './user'

export const SessionTable = pgTable('session', {
  id: uuid('id').primaryKey().default(uuidv7),
  expiresAt: timestamp('expires_at', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
  provider: smallint('provider').$type<AccountProvider>().notNull(),
  roles: smallint('roles').array().notNull().$type<UserRole[]>().notNull(),
  userId: uuid('user_id')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  referrerId: uuid('referrer_id').references(() => UserTable.id, {
    onDelete: 'set null',
  }),
  referralCampaignId: uuid('referral_campaign_id').references(
    () => ReferralCampaignTable.id,
    { onDelete: 'set null' },
  ),
})

export type SessionSelect = typeof SessionTable.$inferSelect
