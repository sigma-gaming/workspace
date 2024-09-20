import { relations } from 'drizzle-orm'
import { ReferrerBalanceTable } from './referrer-balance'
import { UserTable } from './user'

export const ReferrerBalanceRelations = relations(
  ReferrerBalanceTable,
  ({ one }) => ({
    referrer: one(UserTable, {
      fields: [ReferrerBalanceTable.referrerId],
      references: [UserTable.id],
    }),
  }),
)
