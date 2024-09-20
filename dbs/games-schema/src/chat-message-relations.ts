import { relations } from 'drizzle-orm'
import { ChatMessageTable } from './chat-message'
import { UserTable } from './user'

export const ChatMessageRelations = relations(ChatMessageTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [ChatMessageTable.userId],
    references: [UserTable.id],
  }),
}))
