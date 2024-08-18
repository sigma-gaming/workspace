import { relations } from 'drizzle-orm'
import { PromocodeTable } from './promocodes'
import { UserTable } from './users'

export const promocodesRelations = relations(PromocodeTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [PromocodeTable.userId],
    references: [UserTable.id],
  }),
}))
