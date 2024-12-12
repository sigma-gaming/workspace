import { relations } from 'drizzle-orm'
import { UserTable } from './user'
import { UserSecurityTable } from './user-security'

export const UserSecurityRelations = relations(
  UserSecurityTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [UserSecurityTable.userId],
      references: [UserTable.id],
    }),
  }),
)
