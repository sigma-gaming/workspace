import { relations } from 'drizzle-orm'
import { AccountTable } from './account'
import { UserTable } from './user'

export const AccountRelations = relations(AccountTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [AccountTable.userId],
    references: [UserTable.id],
  }),
}))
