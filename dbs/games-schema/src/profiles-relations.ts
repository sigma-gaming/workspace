import { relations } from 'drizzle-orm'
import { ProfileTable } from './profiles'
import { UserTable } from './users'

export const profileRelations = relations(ProfileTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [ProfileTable.userId],
    references: [UserTable.id],
  }),
}))
