import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { pgTable, primaryKey, smallint, uuid } from 'drizzle-orm/pg-core'
import { UserTable } from '../user/user'
import { GlobalTaskTable } from './global-task'

export const GlobalTaskStatusTable = pgTable(
  'global_task_status',
  {
    taskKey: smallint('task_key')
      .$type<GlobalTaskKey>()
      .references(() => GlobalTaskTable.key)
      .notNull(),
    userId: uuid('user_id')
      .references(() => UserTable.id, { onDelete: 'cascade' })
      .notNull(),

    status: smallint('status').$type<TaskStatus>().notNull(),
  },
  (table) => ({
    pkey: primaryKey({ columns: [table.taskKey, table.userId] }),
  }),
)

export type GlobalTaskStatusSelect = typeof GlobalTaskStatusTable.$inferSelect
