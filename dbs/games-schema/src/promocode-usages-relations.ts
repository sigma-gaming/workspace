import { relations } from 'drizzle-orm'
import { PromocodeUsageTable } from './promocode-usages'
import { PromocodeTable } from './promocodes'
import { UserTable } from './users'

export const promocodeUsagesRelations = relations(
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
