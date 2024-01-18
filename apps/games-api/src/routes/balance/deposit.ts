import { BadRequestException } from '@libs/exceptions'
import { TransactionType } from '@libs/games-model'
import { SessionService } from '../../services/session'
import { prisma } from '../../shared/db'
import { redlock } from '../../shared/redis'
import { procedure } from '../trpc'

export const deposit = procedure.mutation(async ({ ctx }) => {
  const user = SessionService.getUser(ctx.session)
  const amount = 10000

  const lock = await redlock.acquire([`balance-${user.id}`], 2500)

  try {
    const lastTransaction = await prisma.transaction.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    const lastBalance = lastTransaction?.closingBalance ?? 0

    const newTransaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: TransactionType.Deposit,
        amount,
        openingBalance: lastBalance,
        closingBalance: lastBalance + amount,
      },
    })

    return {
      status: 'success',
      updatedBalance: newTransaction.closingBalance,
    }
  } catch (error) {
    ctx.req.log.error(error)
    throw new BadRequestException({ message: 'Deposit failure' })
  } finally {
    await lock.release()
  }
})
