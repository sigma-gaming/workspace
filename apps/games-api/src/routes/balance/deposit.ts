import { InternalServerException, RouteException } from '@libs/exceptions'
import { TransactionType } from '@games/db-schema'
import { gamesCaches } from '@games/redis'
import {
  budgetService,
  sessionService,
  transactionService,
} from '@games/services'
import { procedure } from '../trpc'

export const deposit = procedure.mutation(async ({ ctx }) => {
  const user = sessionService.getUser(ctx.session)
  const amount = 1000000

  const lock = await gamesCaches.lastTransaction.lock(user.id, 10000)

  try {
    const lastTransaction = await transactionService.getLastTransaction(user.id)

    const lastBalance = lastTransaction?.closingBalance ?? 0

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
    })

    await budgetService.increaseBudget(amount)

    return {
      status: 'success',
      updatedBalance: newTransaction.closingBalance,
    }
  } catch (error) {
    if (error instanceof RouteException) {
      throw error
    }

    throw new InternalServerException()
  } finally {
    await lock.release()
  }
})
