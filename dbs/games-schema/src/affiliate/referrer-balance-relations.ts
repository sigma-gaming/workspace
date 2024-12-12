import { relations } from 'drizzle-orm'
import { UserTable } from '../user/user'
import { ReferrerBalanceTable } from './referrer-balance'

export const ReferrerBalanceRelations = relations(
  ReferrerBalanceTable,
  ({ one }) => ({
    referrer: one(UserTable, {
      fields: [ReferrerBalanceTable.referrerId],
      references: [UserTable.id],
    }),
  }),
)
