import { PromocodeUsageStatus } from '@dbs/games-types'
import {
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { UserTable } from '../user/user'
import { PromocodeTable } from './promocode'

export const PromocodeUsageTable = pgTable(
  'promocode_usage',
  {
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),

    status: smallint('status').$type<PromocodeUsageStatus>().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),

    promocodeId: uuid('promocode_id')
      .references(() => PromocodeTable.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => UserTable.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    pkey: primaryKey({ columns: [table.promocodeId, table.userId] }),
  }),
)

export type PromocodeUsageSelect = typeof PromocodeUsageTable.$inferSelect
