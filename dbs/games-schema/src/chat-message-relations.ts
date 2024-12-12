import { relations } from 'drizzle-orm'
import { ChatMessageTable } from './chat-message'
import { ProfileTable } from './user/profile'
import { UserTable } from './user/user'

export const ChatMessageRelations = relations(ChatMessageTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [ChatMessageTable.userId],
    references: [UserTable.id],
  }),
  profile: one(ProfileTable, {
    fields: [ChatMessageTable.profileId],
    references: [ProfileTable.id],
  }),
}))
