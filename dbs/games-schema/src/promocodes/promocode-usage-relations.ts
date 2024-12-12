import { relations } from 'drizzle-orm'
import { UserTable } from '../user/user'
import { PromocodeTable } from './promocode'
import { PromocodeUsageTable } from './promocode-usage'

export const PromocodeUsageRelations = relations(
  PromocodeUsageTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [PromocodeUsageTable.userId],
      references: [UserTable.id],
    }),
    promocode: one(PromocodeTable, {
      fields: [PromocodeUsageTable.promocodeId],
      references: [PromocodeTable.id],
    }),
  }),
)
