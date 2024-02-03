import { sql } from 'drizzle-orm'
import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { userRoleEnum } from './enums'

export const Users = pgTable('Users', {
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

  profileId: uuid('profileId'),
})

export type User = typeof Users.$inferSelect
export type UserInsert = typeof Users.$inferInsert
