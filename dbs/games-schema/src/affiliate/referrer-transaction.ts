import { ReferralAction } from '@dbs/games-types'
import {
  bigint,
  boolean,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { uuidv7 } from '../lib/sql'
import { UserTable } from '../user/user'
import { ReferralCampaignTable } from './referral-campaign'

export const ReferrerTransactionTable = pgTable(
  'referrer_transaction',
  {
    id: uuid('id').primaryKey().default(uuidv7),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    referralAction: smallint('referral_action')
      .$type<ReferralAction>()
      .notNull(),
    referralName: text('referral_name').default('').notNull(),
    referralImage: text('referral_image'),
    referralUsername: text('referral_username'),
    isProcessed: boolean('is_processed').notNull().default(false),

    referrerId: uuid('referrer_id')
      .references(() => UserTable.id, { onDelete: 'cascade' })
      .notNull(),
    referralId: uuid('referral_id').references(() => UserTable.id, {
      onDelete: 'set null',
    }),
    referralCampaignId: uuid('referral_campaign_id').references(
      () => ReferralCampaignTable.id,
      { onDelete: 'set null' },
    ),
  },
  (table) => ({
    referrerIdIdx: index('IX_referrer_transaction_referrer_id').on(
      table.referrerId,
    ),
    createdAtIdx: index('IX_referrer_transaction_created_at').on(
      table.createdAt,
    ),
  }),
)

export type ReferrerTransactionSelect =
  typeof ReferrerTransactionTable.$inferSelect
export type ReferrerTransactionInsert =
  typeof ReferrerTransactionTable.$inferInsert
