import { relations } from 'drizzle-orm'
import { Notifications } from './notifications'
import { Users } from './users'

export const notificationsRelations = relations(Notifications, ({ one }) => ({
  user: one(Users, {
    fields: [Notifications.userId],
    references: [Users.id],
  }),
}))
