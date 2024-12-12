import { relations } from 'drizzle-orm'
import { UserTable } from '../user/user'
import { ReferrerPayoutTable } from './referrer-payout'

export const ReferrerPayoutRelations = relations(
  ReferrerPayoutTable,
  ({ one }) => ({
    referrer: one(UserTable, {
      fields: [ReferrerPayoutTable.referrerId],
      references: [UserTable.id],
    }),
  }),
)
