import { relations } from 'drizzle-orm'
import { UserTable } from '../user/user'
import { PromocodeTable } from './promocode'

export const PromocodeRelations = relations(PromocodeTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [PromocodeTable.userId],
    references: [UserTable.id],
  }),
}))
