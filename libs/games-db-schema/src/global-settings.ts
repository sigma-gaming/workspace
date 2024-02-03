import { boolean, integer, pgTable, timestamp } from 'drizzle-orm/pg-core'

export const GlobalSettings = pgTable('GlobalSettings', {
  id: integer('id').default(1).primaryKey(),
  createdAt: timestamp('createdAt', {
    withTimezone: true,
    mode: 'string',
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', {
    withTimezone: true,
    mode: 'string',
  })
    .notNull()
    .defaultNow(),
  maintenanceMode: boolean('maintenanceMode').notNull().default(false),
})

export type GlobalSettings = typeof GlobalSettings.$inferSelect
