import { createSingletonProxy } from '@core/di'
import { gamesDb } from '@dbs/games-db'
import {
  TransactionInsert,
  TransactionSelect,
  TransactionTable,
} from '@dbs/games-schema'
import { TransactionType } from '@dbs/games-types'
import { gemInt } from '@games/model'
import { gamesCaches } from '@games/redis'
import { desc, eq, sql } from 'drizzle-orm'
import { singleton } from 'tsyringe-neo'

type TransactionInsertWithUserId = TransactionInsert & { userId: string }

@singleton()
export class TransactionService {
  lock = async (userId: string, ms = 3000) => {
    return gamesCaches.lastTransaction.lock(userId, ms)
  }

  getLastTransaction = async (
    userId: string,
  ): Promise<TransactionSelect | null> => {
    const cached = await gamesCaches.lastTransaction.get(userId)

    if (cached) {
      return cached
    }

    const transaction = await this.getLastTransactionQuery.execute({ userId })

    if (transaction) {
      await gamesCaches.lastTransaction.set(userId, transaction)
    }

    return transaction ?? null
  }

  getTransaction = async (
    transactionId: number,
  ): Promise<TransactionSelect | null> => {
    const transaction = await gamesDb.query.TransactionTable.findFirst({
      where: eq(TransactionTable.id, transactionId),
    })

    return transaction ?? null
  }

  generateTransaction(
    lastTransaction: TransactionSelect | null,
    payload: Pick<TransactionInsert, 'type' | 'amount' | 'userId'> & {
      userId: string
      wageringIncrease?: number
    },
  ): TransactionInsertWithUserId {
    if (
      payload.type !== TransactionType.Deposit &&
      payload.type !== TransactionType.Withdrawal &&
      payload.type !== TransactionType.Bonus
    ) {
      throw new Error('Invalid transaction type')
    }

    const lastBalance = lastTransaction?.closingBalance ?? 0

    let wageringRequired = lastTransaction?.wageringRequired ?? 0
    const totalBet = lastTransaction?.totalBet ?? 0
    const totalWon = lastTransaction?.totalWon ?? 0
    const totalLost = lastTransaction?.totalLost ?? 0
    const totalRTP = lastTransaction?.totalRTP ?? 0

    if (typeof payload.wageringIncrease === 'number') {
      wageringRequired += payload.wageringIncrease
    } else if (payload.type === TransactionType.Deposit) {
      wageringRequired += Math.ceil(payload.amount * 0.5)
    }

    return {
      ...payload,
      openingBalance: lastBalance,
      closingBalance: lastBalance + payload.amount,
      totalBet,
      totalWon,
      totalLost,
      totalRTP,
      wageringRequired,
    }
  }

  generateGameTransaction(
    lastTransaction: TransactionSelect | null | undefined,
    payload: Pick<TransactionInsert, 'type' | 'amount' | 'userId'> &
      Required<Pick<TransactionInsert, 'game'>> & {
        userId: string
        bet: number
        wageringDecrease?: number
      },
  ): TransactionInsertWithUserId {
    const { type, amount, userId, game, bet, wageringDecrease } = payload

    if (type !== TransactionType.Win && type !== TransactionType.Loss) {
      throw new Error('Invalid transaction type')
    }

    const lastBalance = lastTransaction?.closingBalance ?? 0

    let wageringRequired = lastTransaction?.wageringRequired ?? 0
    let totalBet = lastTransaction?.totalBet ?? 0
    let totalWon = lastTransaction?.totalWon ?? 0
    let totalLost = lastTransaction?.totalLost ?? 0
    let totalRTP = lastTransaction?.totalRTP ?? 0

    const openingBalance = lastBalance
    const closingBalance = lastBalance + amount

    if (closingBalance < gemInt(1)) {
      wageringRequired = 0
    } else if (typeof wageringDecrease === 'number') {
      wageringRequired -= wageringDecrease
    } else {
      wageringRequired -= bet
    }

    if (type === TransactionType.Win) {
      totalBet += amount
      totalWon += amount
      totalRTP += amount + bet
    }

    if (type === TransactionType.Loss) {
      totalBet += amount
      totalLost += amount
      totalRTP += amount + bet
    }

    return {
      type,
      amount,
      userId,
      game,
      openingBalance,
      closingBalance,
      totalBet,
      totalWon,
      totalLost,
      totalRTP,
      wageringRequired: Math.max(0, wageringRequired),
    }
  }

  async createTransaction({
    tx,
    payload,
    autoUpdateCache = !tx,
  }: {
    tx?: typeof gamesDb
    payload: TransactionInsertWithUserId
    autoUpdateCache?: boolean
  }) {
    const db = tx ?? gamesDb

    const [newTransaction] = await db
      .insert(TransactionTable)
      .values(payload)
      .returning()

    const updateCache = () => {
      return gamesCaches.lastTransaction.set(payload.userId, newTransaction)
    }

    if (autoUpdateCache) {
      await updateCache()
    }

    return [newTransaction, updateCache] as const
  }

  getLastTransactionQuery = gamesDb.query.TransactionTable.findFirst({
    where: eq(TransactionTable.userId, sql.placeholder('userId')),
    orderBy: desc(TransactionTable.id),
  }).prepare('transactionQuery')
}

export const transactionService = createSingletonProxy(TransactionService)
