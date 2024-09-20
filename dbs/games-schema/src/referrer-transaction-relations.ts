import { relations } from 'drizzle-orm'
import { ReferrerTransactionTable } from './referrer-transaction'
import { UserTable } from './user'

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
  }),
)
