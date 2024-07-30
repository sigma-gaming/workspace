import { sql } from 'drizzle-orm'
import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { userRoleEnum } from './enums'

export const UserTable = pgTable('User', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
  roles: userRoleEnum('roles')
    .array()
    .notNull()
    .default(sql`'{"User"}'`),

  profileId: integer('profileId'),
})

export type UserSelect = typeof UserTable.$inferSelect
export type UserInsert = typeof UserTable.$inferInsert
