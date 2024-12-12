import { relations } from 'drizzle-orm'
import { UserTable } from '../user/user'
import { ReferralCampaignTable } from './referral-campaign'
import { ReferrerTransactionTable } from './referrer-transaction'

export const ReferrerTransactionRelations = relations(
  ReferrerTransactionTable,
  ({ one }) => ({
    referrer: one(UserTable, {
      fields: [ReferrerTransactionTable.referrerId],
      references: [UserTable.id],
      relationName: 'referrer',
    }),
    referral: one(UserTable, {
      fields: [ReferrerTransactionTable.referralId],
      references: [UserTable.id],
      relationName: 'referral',
    }),
    referralCampaign: one(ReferralCampaignTable, {
      fields: [ReferrerTransactionTable.referralCampaignId],
      references: [ReferralCampaignTable.id],
    }),
  }),
)
