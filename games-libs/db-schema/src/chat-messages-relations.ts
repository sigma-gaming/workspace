import { relations } from 'drizzle-orm'
import { ChatMessageTable } from './chat-messages'
import { UserTable } from './users'

export const chatMessageRelations = relations(ChatMessageTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [ChatMessageTable.userId],
    references: [UserTable.id],
  }),
}))
