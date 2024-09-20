import { relations } from 'drizzle-orm'
import { GlobalTaskTable } from './global-task'
import { GlobalTaskStatusTable } from './global-task-status'
import { UserTable } from './user'

export const GlobalTaskStatusRelations = relations(
  GlobalTaskStatusTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [GlobalTaskStatusTable.userId],
      references: [UserTable.id],
    }),
    task: one(GlobalTaskTable, {
      fields: [GlobalTaskStatusTable.taskKey],
      references: [GlobalTaskTable.key],
    }),
  }),
)
