import { integer, pgTable, timestamp } from 'drizzle-orm/pg-core'

export const GlobalSettingsTable = pgTable('GlobalSettings', {
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
})

export type GlobalSettingsSelect = typeof GlobalSettingsTable.$inferSelect
