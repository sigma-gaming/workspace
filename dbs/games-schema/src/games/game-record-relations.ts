import { relations } from 'drizzle-orm'
import { TransactionTable } from '../finances/transaction'
import { UserTable } from '../user/user'
import { GameRecordTable } from './game-record'

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
