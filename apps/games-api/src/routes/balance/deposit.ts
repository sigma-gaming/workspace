import { InternalServerException, RouteException } from '@core/exceptions'
import { TransactionType } from '@dbs/games-types'
import { gamesCaches } from '@games/redis'
import {
  budgetService,
  sessionService,
  transactionService,
} from '@games/services'
import { Hono } from 'hono'

export const depositRoute = new Hono().post('/', async (ctx) => {
  const session = await sessionService.getHonoSession(ctx)
  const user = sessionService.getUser(session)
  const amount = 1000000

  const lock = await gamesCaches.lastTransaction.lock(user.id, 10000)

  try {
    const lastTransaction = await transactionService.getLastTransaction(user.id)

    const lastBalance = lastTransaction?.closingBalance ?? 0
    const lastWageringRequired = lastTransaction?.wageringRequired ?? 0

    const newTransaction = await transactionService.createTransaction(user.id, {
      type: TransactionType.Deposit,
      game: null,
      amount,
      openingBalance: lastBalance,
      closingBalance: lastBalance + amount,
      totalBet: lastTransaction?.totalBet ?? 0,
      totalWon: lastTransaction?.totalWon ?? 0,
      totalLost: lastTransaction?.totalLost ?? 0,
      totalRTP: lastTransaction?.totalRTP ?? 0,
      wageringRequired: lastWageringRequired + amount,
    })

    await budgetService.increaseAvailable(amount)

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
