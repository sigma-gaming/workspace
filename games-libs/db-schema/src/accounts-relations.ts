import { relations } from 'drizzle-orm'
import { Accounts } from './accounts'
import { Users } from './users'

export const accountsRelations = relations(Accounts, ({ one }) => ({
  user: one(Users, {
    fields: [Accounts.userId],
    references: [Users.id],
  }),
}))
