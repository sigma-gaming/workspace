import type { DomainApp } from '@dbs/games-types-private'
import { pgTable, smallint, text, timestamp } from 'drizzle-orm/pg-core'

export const DomainTable = pgTable('domain', {
  host: text('host').primaryKey(),
  app: smallint('app').$type<DomainApp>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
})

export type DomainSelect = typeof DomainTable.$inferSelect
