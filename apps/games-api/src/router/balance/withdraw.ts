import {
  BadRequestException,
  InternalServerException,
  RouteException,
} from '@core/exceptions'
import { TransactionType } from '@dbs/games-schema'
import { gamesCaches } from '@games/redis'
import {
  budgetService,
  sessionService,
  transactionService,
} from '@games/services'
import { Hono } from 'hono'

export const withdrawRoute = new Hono().post('/', async (ctx) => {
  const session = await sessionService.getSession(ctx.req)
  const user = sessionService.getUser(session)
  const amount = 1000000

  const lock = await gamesCaches.lastTransaction.lock(user.id, 10000)

  try {
    const lastTransaction = await transactionService.getLastTransaction(user.id)

    const lastBalance = lastTransaction?.closingBalance ?? 0

    if (lastBalance < amount) {
      throw new BadRequestException({
        message: 'Недостаточно голды на балике',
      })
    }

    if (!lastTransaction) {
      throw new InternalServerException()
    }

    const newTransaction = await transactionService.createTransaction(user.id, {
      type: TransactionType.Withdrawal,
      game: null,
      amount: -amount,
      openingBalance: lastBalance,
      closingBalance: lastBalance - amount,
      totalBet: lastTransaction.totalBet,
      totalWon: lastTransaction.totalWon,
      totalLost: lastTransaction.totalLost,
      totalRTP: lastTransaction.totalRTP,
    })

    await budgetService.increaseBudget(-amount)

    return ctx.json({
      status: 'success',
      updatedBalance: newTransaction.closingBalance,
    })
  } catch (error) {
    if (error instanceof RouteException) {
      throw error
    }

    throw new InternalServerException()
  } finally {
    await lock.release()
  }
})
