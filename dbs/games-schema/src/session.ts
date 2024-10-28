import { boolean, integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { accountProviderEnum } from './enums'
import { ReferralCampaignTable } from './referral-campaign'
import { UserTable } from './user'

export const SessionTable = pgTable('Session', {
  id: uuid('id').defaultRandom().primaryKey(),
  expiresAt: timestamp('expiresAt', {
    withTimezone: true,
    mode: 'string',
  }).notNull(),
  preventAutoDelete: boolean('preventAutoDelete').default(false).notNull(),
  provider: accountProviderEnum('provider').notNull(),
  userId: uuid('userId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  referrerId: uuid('referrerId').references(() => UserTable.id, {
    onDelete: 'set null',
  }),
  referralCampaignId: integer('referralCampaignId').references(
    () => ReferralCampaignTable.id,
    { onDelete: 'set null' },
  ),
})

export type SessionSelect = typeof SessionTable.$inferSelect
