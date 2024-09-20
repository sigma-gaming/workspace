import { relations } from 'drizzle-orm'
import { ReferralCampaignTable } from './referral-campaign'
import { TransactionTable } from './transaction'
import { UserTable } from './user'

export const ReferralCampaignRelations = relations(
  ReferralCampaignTable,
  ({ one, many }) => ({
    referrals: many(UserTable, {
      relationName: 'referral',
    }),
    referrer: one(UserTable, {
      fields: [ReferralCampaignTable.referrerId],
      references: [UserTable.id],
      relationName: 'referrer',
    }),
    transactions: many(TransactionTable),
  }),
)
