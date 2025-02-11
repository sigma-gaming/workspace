import { sql } from 'drizzle-orm'
import { boolean, integer, pgTable, timestamp } from 'drizzle-orm/pg-core'

export const ConfigTable = pgTable('config', {
  id: integer('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
  maintenanceEnabled: boolean('maintenance_enabled').notNull().default(false),
  backgroundJobsEnabled: boolean('background_jobs_enabled')
    .notNull()
    .default(true),
})

export type ConfigSelect = typeof ConfigTable.$inferSelect
