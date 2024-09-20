import { relations } from 'drizzle-orm'
import { GameRecordTable } from './game-record'
import { ReferralCampaignTable } from './referral-campaign'
import { TransactionTable } from './transaction'
import { UserTable } from './user'

export const TransactionRelations = relations(TransactionTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [TransactionTable.userId],
    references: [UserTable.id],
  }),
  referrer: one(UserTable, {
    fields: [TransactionTable.referrerId],
    references: [UserTable.id],
  }),
  referralCampaign: one(ReferralCampaignTable, {
    fields: [TransactionTable.referralCampaignId],
    references: [ReferralCampaignTable.id],
  }),
  gameRecord: one(GameRecordTable, {
    fields: [TransactionTable.gameRecordId],
    references: [GameRecordTable.id],
  }),
}))
