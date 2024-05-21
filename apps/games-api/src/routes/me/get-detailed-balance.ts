import { BalanceDetailed } from '@games/model'
import { sessionService, transactionService } from '@games/services'
import { procedure } from '../trpc'

export const getDetailedBalance = procedure.query(
  async ({ ctx }): Promise<BalanceDetailed> => {
    const user = sessionService.getUser(ctx.session)

    const recentTransaction = await transactionService.getLastTransaction(
      user.id,
    )

    if (!recentTransaction) {
      return { available: 0 }
    }

    return { available: recentTransaction.closingBalance }
  },
)
