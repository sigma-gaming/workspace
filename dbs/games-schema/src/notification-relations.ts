import { relations } from 'drizzle-orm'
import { NotificationTable } from './notification'
import { UserTable } from './user'

export const NotificationRelations = relations(
  NotificationTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [NotificationTable.userId],
      references: [UserTable.id],
    }),
  }),
)
