import { relations } from 'drizzle-orm'
import { ProfileTable } from './profile'
import { UserTable } from './user'

export const ProfileRelations = relations(ProfileTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [ProfileTable.userId],
    references: [UserTable.id],
  }),
}))
