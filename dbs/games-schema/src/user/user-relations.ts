import { relations } from 'drizzle-orm'
import { ReferralCampaignTable } from '../affiliate/referral-campaign'
import { ReferrerSettingsTable } from '../affiliate/referrer-settings'
import { ReferrerTransactionTable } from '../affiliate/referrer-transaction'
import { BalanceTable } from '../finances/balance'
import { TransactionTable } from '../finances/transaction'
import { GameRecordTable } from '../games/game-record'
import { AccountTable } from './account'
import { ProfileTable } from './profile'
import { SessionTable } from './session'
import { UserTable } from './user'
import { UserSecurityTable } from './user-security'

export const UserRelations = relations(UserTable, ({ one, many }) => ({
  profile: one(ProfileTable, {
    fields: [UserTable.profileId],
    references: [ProfileTable.id],
  }),
  accounts: many(AccountTable),
  sessions: many(SessionTable),

  balance: one(BalanceTable, {
    fields: [UserTable.id],
    references: [BalanceTable.userId],
  }),
  transactions: many(TransactionTable),
  gameRecords: many(GameRecordTable),
  userSecurity: one(UserSecurityTable, {
    fields: [UserTable.id],
    references: [UserSecurityTable.userId],
  }),

  /**
   * Acting as a referral
   */
  referrer: one(UserTable, {
    fields: [UserTable.referrerId],
    references: [UserTable.id],
  }),
  referralCampaign: one(ReferralCampaignTable, {
    fields: [UserTable.referralCampaignId],
    references: [ReferralCampaignTable.id],
    relationName: 'referral',
  }),
  referralTransactions: many(ReferrerTransactionTable, {
    relationName: 'referral',
  }),

  /**
   * Acting as a referrer
   */
  referrerSettings: one(ReferrerSettingsTable, {
    fields: [UserTable.referrerId],
    references: [ReferrerSettingsTable.referrerId],
  }),
  referrerCampaigns: many(ReferralCampaignTable, {
    relationName: 'referrer',
  }),
  referrerTransactions: many(ReferrerTransactionTable, {
    relationName: 'referrer',
  }),
}))
