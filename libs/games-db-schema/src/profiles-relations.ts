import { relations } from 'drizzle-orm'
import { Profiles } from './profiles'
import { Users } from './users'

export const profilesRelations = relations(Profiles, ({ one }) => ({
  user: one(Users, {
    fields: [Profiles.userId],
    references: [Users.id],
  }),
}))
