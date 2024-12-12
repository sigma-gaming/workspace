import { relations } from 'drizzle-orm'
import { UserTable } from '../user/user'
import { ReferrerWithdrawalTable } from './referrer-withdrawal'

export const ReferrerWithdrawalRelations = relations(
  ReferrerWithdrawalTable,
  ({ one }) => ({
    referrer: one(UserTable, {
      fields: [ReferrerWithdrawalTable.referrerId],
      references: [UserTable.id],
    }),
  }),
)
