import { GlobalTaskKey, GlobalTaskRequirements } from '@dbs/games-types'
import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  smallint,
  timestamp,
} from 'drizzle-orm/pg-core'

export const GlobalTaskTable = pgTable('global_task', {
  key: smallint('key').$type<GlobalTaskKey>().primaryKey(),

  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),

  isActive: boolean('is_active').default(true).notNull(),
  requirements: jsonb('requirements').$type<GlobalTaskRequirements>().notNull(),
  payout: bigint('payout', { mode: 'number' }).notNull(),
  wageringMultiplier: integer('wagering_multiplier').notNull(),
})

export type GlobalTaskSelect = typeof GlobalTaskTable.$inferSelect
