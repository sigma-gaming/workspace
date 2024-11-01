import { GlobalTaskRequirements } from '@dbs/games-types'
import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  timestamp,
} from 'drizzle-orm/pg-core'
import { globalTaskKeyEnum } from './enums'

export const GlobalTaskTable = pgTable('GlobalTask', {
  key: globalTaskKeyEnum('key').primaryKey(),

  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),

  isActive: boolean('isActive').default(true).notNull(),
  requirements: jsonb('requirements').$type<GlobalTaskRequirements>().notNull(),
  payout: bigint('payout', { mode: 'number' }).notNull(),
  wageringMultiplier: integer('wageringMultiplier').notNull(),
})

export type GlobalTaskSelect = typeof GlobalTaskTable.$inferSelect
