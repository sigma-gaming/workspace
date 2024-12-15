import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { domainAppEnum } from './enums'

export const DomainTable = pgTable('Domain', {
  host: text('host').primaryKey(),
  app: domainAppEnum('app').notNull(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
})

export type DomainSelect = typeof DomainTable.$inferSelect
