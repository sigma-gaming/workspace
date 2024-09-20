import { relations } from 'drizzle-orm'
import { SessionTable } from './session'
import { UserTable } from './user'

export const SessionRelations = relations(SessionTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [SessionTable.userId],
    references: [UserTable.id],
  }),
}))
