import {
  bigint,
  bigserial,
  boolean,
  integer,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { referralActionEnum } from './enums'
import { ReferralCampaignTable } from './referral-campaign'
import { UserTable } from './user'

export const ReferrerTransactionTable = pgTable('ReferrerTransaction', {
  id: bigserial('id', { mode: 'number' }).primaryKey().notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  referralAction: referralActionEnum('referralAction').notNull(),
  isProcessed: boolean('isProcessed').notNull().default(false),

  referrerId: uuid('referrerId')
    .references(() => UserTable.id, { onDelete: 'cascade' })
    .notNull(),
  referralId: uuid('referralId').references(() => UserTable.id, {
    onDelete: 'set null',
  }),
  referralCampaignId: integer('referralCampaignId').references(
    () => ReferralCampaignTable.id,
    { onDelete: 'set null' },
  ),
})

export type ReferrerTransactionSelect =
  typeof ReferrerTransactionTable.$inferSelect
export type ReferrerTransactionInsert =
  typeof ReferrerTransactionTable.$inferInsert
