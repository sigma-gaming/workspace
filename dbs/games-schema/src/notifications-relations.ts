import { relations } from 'drizzle-orm'
import { NotificationTable } from './notifications'
import { UserTable } from './users'

export const notificationRelations = relations(
  NotificationTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [NotificationTable.userId],
      references: [UserTable.id],
    }),
  }),
)
