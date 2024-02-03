import { bigint, integer, pgTable, timestamp } from 'drizzle-orm/pg-core'

export const Budget = pgTable('Budget', {
  id: integer('id').default(1).primaryKey(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  lastSyncAt: timestamp('lastSyncAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  available: bigint('available', { mode: 'number' })
    .notNull()
    .default(100_000_00),
  unwantedLoss: bigint('unwantedLoss', { mode: 'number' })
    .notNull()
    .default(50_000_00),
  maxLoss: bigint('maxLoss', { mode: 'number' }).notNull().default(100_000_00),
})

export type Budget = typeof Budget.$inferSelect
