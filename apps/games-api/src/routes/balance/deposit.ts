import { InternalServerException, RouteException } from '@libs/exceptions'
import { TransactionType } from '@libs/games-model'
import { lastTransactionCache } from '../../caches/transaction'
import { BudgetService } from '../../services/budget'
import { SessionService } from '../../services/session'
import { TransactionService } from '../../services/transaction'
import { procedure } from '../trpc'

export const deposit = procedure.mutation(async ({ ctx }) => {
  const user = SessionService.getUser(ctx.session)
  const amount = 1000000

  const lock = await lastTransactionCache.lock(user.id, 10000)

  try {
    const lastTransaction = await TransactionService.getLastTransaction(user.id)

    const lastBalance = lastTransaction?.closingBalance ?? 0

    const newTransaction = await TransactionService.createTransaction(user.id, {
      type: TransactionType.Deposit,
      amount,
      openingBalance: lastBalance,
      closingBalance: lastBalance + amount,
    })

    await BudgetService.increaseBudget(amount)

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
