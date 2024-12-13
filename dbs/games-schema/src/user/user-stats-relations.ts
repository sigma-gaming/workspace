import { relations } from 'drizzle-orm'
import { UserTable } from './user'
import { UserStatsTable } from './user-stats'

export const UserStatsRelations = relations(UserStatsTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [UserStatsTable.userId],
    references: [UserTable.id],
  }),
}))
