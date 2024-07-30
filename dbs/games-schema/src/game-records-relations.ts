import { relations } from 'drizzle-orm'
import { GameRecordTable } from './game-records'
import { TransactionTable } from './transactions'
import { UserTable } from './users'

export const GameRecordsRelations = relations(GameRecordTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [GameRecordTable.userId],
    references: [UserTable.id],
  }),
  transaction: one(TransactionTable, {
    fields: [GameRecordTable.transactionId],
    references: [TransactionTable.id],
  }),
}))
