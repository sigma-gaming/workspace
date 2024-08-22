import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import { promocodeUsageStatusEnum } from './enums'
import { PromocodeTable } from './promocodes'
import { UserTable } from './users'

export const PromocodeUsageTable = pgTable(
  'PromocodeUsage',
  {
    createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),

    status: promocodeUsageStatusEnum('status').notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true, mode: 'string' }),

    promocodeId: uuid('promocodeId')
      .references(() => PromocodeTable.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('userId')
      .references(() => UserTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    pkey: primaryKey({ columns: [table.promocodeId, table.userId] }),
  }),
)

export type PromocodeUsageSelect = typeof PromocodeUsageTable.$inferSelect
