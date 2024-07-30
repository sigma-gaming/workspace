import { relations } from 'drizzle-orm'
import { AccountTable } from './accounts'
import { UserTable } from './users'

export const accountRelations = relations(AccountTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [AccountTable.userId],
    references: [UserTable.id],
  }),
}))
