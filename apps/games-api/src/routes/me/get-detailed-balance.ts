import { BalanceDetailed } from '@libs/games-model'
import { SessionService } from '../../services/session'
import { prisma } from '../../shared/db'
import { procedure } from '../trpc'

export const getDetailedBalance = procedure.query(
  async ({ ctx }): Promise<BalanceDetailed> => {
    const user = SessionService.getUser(ctx.session)

    const recentTransaction = await prisma.transaction.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    if (!recentTransaction) {
      return { available: 0 }
    }

    return { available: recentTransaction.closingBalance }
  },
)
