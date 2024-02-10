import { relations } from 'drizzle-orm'
import { Sessions } from './sessions'
import { Users } from './users'

export const sessionsRelations = relations(Sessions, ({ one }) => ({
  user: one(Users, {
    fields: [Sessions.userId],
    references: [Users.id],
  }),
}))
