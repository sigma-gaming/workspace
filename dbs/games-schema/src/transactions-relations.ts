import { relations } from 'drizzle-orm'
import { GameRecordTable } from './game-records'
import { TransactionTable } from './transactions'
import { UserTable } from './users'

export const transactionRelations = relations(TransactionTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [TransactionTable.userId],
    references: [UserTable.id],
  }),
  gameRecord: one(GameRecordTable, {
    fields: [TransactionTable.gameRecordId],
    references: [GameRecordTable.id],
  }),
}))
