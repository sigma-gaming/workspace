import { TransactionType } from '@games/db-schema'
import { gamesCaches } from '@games/redis'
import {
  budgetService,
  sessionService,
  transactionService,
} from '@games/services'
import {
  BadRequestException,
  InternalServerException,
  RouteException,
} from '@libs/exceptions'
import { procedure } from '../trpc'

export const withdraw = procedure.mutation(async ({ ctx }) => {
  const user = sessionService.getUser(ctx.session)
  const amount = 1000000

  const lock = await gamesCaches.lastTransaction.lock(user.id, 10000)

  try {
    const lastTransaction = await transactionService.getLastTransaction(user.id)

    const lastBalance = lastTransaction?.closingBalance ?? 0

    if (lastBalance < amount) {
      throw new BadRequestException({ message: 'Недостаточно голды на балике' })
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
