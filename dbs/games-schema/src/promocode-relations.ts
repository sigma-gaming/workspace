import { relations } from 'drizzle-orm'
import { PromocodeTable } from './promocode'
import { UserTable } from './user'

export const PromocodeRelations = relations(PromocodeTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [PromocodeTable.userId],
    references: [UserTable.id],
  }),
}))
