import { relations } from 'drizzle-orm'
import { TransactionTable } from '../finances/transaction'
import { UserTable } from '../user/user'
import { ReferralCampaignTable } from './referral-campaign'

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
