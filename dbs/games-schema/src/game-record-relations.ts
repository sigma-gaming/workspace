import { relations } from 'drizzle-orm'
import { GameRecordTable } from './game-record'
import { TransactionTable } from './transaction'
import { UserTable } from './user'

export const GameRecordRelations = relations(GameRecordTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [GameRecordTable.userId],
    references: [UserTable.id],
  }),
  transaction: one(TransactionTable, {
    fields: [GameRecordTable.transactionId],
    references: [TransactionTable.id],
  }),
}))
