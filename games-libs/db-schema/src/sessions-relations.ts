import { relations } from 'drizzle-orm'
import { SessionTable } from './sessions'
import { UserTable } from './users'

export const sessionRelations = relations(SessionTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [SessionTable.userId],
    references: [UserTable.id],
  }),
}))
