import { BalanceDetailed } from '@libs/games-model'
import { SessionService } from '../../services/session'
import { TransactionService } from '../../services/transaction'
import { procedure } from '../trpc'

export const getDetailedBalance = procedure.query(
  async ({ ctx }): Promise<BalanceDetailed> => {
    const user = SessionService.getUser(ctx.session)

    const recentTransaction = await TransactionService.getLastTransaction(
      user.id,
    )

    if (!recentTransaction) {
      return { available: 0 }
    }

    return { available: recentTransaction.closingBalance }
  },
)
