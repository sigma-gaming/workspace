import { relations } from 'drizzle-orm'
import { ReferrerWithdrawalTable } from './referrer-withdrawal'
import { UserTable } from './user'

export const ReferrerWithdrawalRelations = relations(
  ReferrerWithdrawalTable,
  ({ one }) => ({
    referrer: one(UserTable, {
      fields: [ReferrerWithdrawalTable.referrerId],
      references: [UserTable.id],
    }),
  }),
)
