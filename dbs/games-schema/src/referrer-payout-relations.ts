import { relations } from 'drizzle-orm'
import { ReferrerPayoutTable } from './referrer-payout'
import { UserTable } from './user'

export const ReferrerPayoutRelations = relations(
  ReferrerPayoutTable,
  ({ one }) => ({
    referrer: one(UserTable, {
      fields: [ReferrerPayoutTable.referrerId],
      references: [UserTable.id],
    }),
  }),
)
