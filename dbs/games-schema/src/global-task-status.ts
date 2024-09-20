import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core'
import { globalTaskKeyEnum, taskStatusEnum } from './enums'
import { GlobalTaskTable } from './global-task'
import { UserTable } from './user'

export const GlobalTaskStatusTable = pgTable(
  'GlobalTaskStatus',
  {
    taskKey: globalTaskKeyEnum('taskKey')
      .references(() => GlobalTaskTable.key)
      .notNull(),
    userId: uuid('userId')
      .references(() => UserTable.id)
      .notNull(),

    status: taskStatusEnum('status').notNull(),
  },
  (table) => ({
    pkey: primaryKey({ columns: [table.taskKey, table.userId] }),
  }),
)

export type GlobalTaskStatusSelect = typeof GlobalTaskStatusTable.$inferSelect
