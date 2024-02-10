import { relations } from 'drizzle-orm'
import { Transactions } from './transactions'
import { Users } from './users'

export const transactionsRelations = relations(Transactions, ({ one }) => ({
  user: one(Users, {
    fields: [Transactions.userId],
    references: [Users.id],
  }),
}))
