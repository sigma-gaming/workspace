import { sql } from 'drizzle-orm'
import { boolean, integer, pgTable, timestamp } from 'drizzle-orm/pg-core'

export const ConfigTable = pgTable('Config', {
  id: integer('id').default(1).primaryKey(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
  maintenanceEnabled: boolean('maintenanceEnabled').notNull().default(false),
  backgroundJobsEnabled: boolean('backgroundJobsEnabled')
    .notNull()
    .default(true),
})

export type ConfigSelect = typeof ConfigTable.$inferSelect
