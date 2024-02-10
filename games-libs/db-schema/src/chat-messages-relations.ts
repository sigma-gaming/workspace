import { relations } from 'drizzle-orm'
import { ChatMessages } from './chat-messages'
import { Users } from './users'

export const chatMessagesRelations = relations(ChatMessages, ({ one }) => ({
  user: one(Users, {
    fields: [ChatMessages.userId],
    references: [Users.id],
  }),
}))
