import { relations } from 'drizzle-orm'
import { UserSecurityTable } from './user-security'
import { UserTable } from './users'

export const userSecurityRelations = relations(
  UserSecurityTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [UserSecurityTable.userId],
      references: [UserTable.id],
    }),
  }),
)
