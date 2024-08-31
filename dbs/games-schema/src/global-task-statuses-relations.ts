import { relations } from 'drizzle-orm'
import { GlobalTaskStatusTable } from './global-task-statuses'
import { GlobalTaskTable } from './global-tasks'
import { UserTable } from './users'

export const globalTaskStatusesRelations = relations(
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
