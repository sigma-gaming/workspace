import {
  BadRequestException,
  InternalServerException,
  RouteException,
} from '@core/exceptions'
import { FraudRisk, TransactionType } from '@dbs/games-types'
import { formatGem, gemFloat } from '@games/model'
import { gamesCaches } from '@games/redis'
import {
  fraudService,
  sessionService,
  transactionService,
} from '@games/services'
import { createRouter } from '../../hono'

export const withdrawRoute = createRouter().post('/', async (ctx) => {
  const session = await sessionService.getHonoSession(ctx)
  const user = sessionService.getUser(session)
  const amount = 1000000

  const lock = await gamesCaches.lastTransaction.lock(user.id, 10000)

  try {
    const risk = await fraudService.actualizeRisk(user.id, { ctx })

    if (risk === FraudRisk.High) {
      throw new BadRequestException({
        message: 'Не удалось произвести вывод',
      })
    }

    const lastTransaction = await transactionService.getLastTransaction(user.id)

    const lastBalance = lastTransaction?.closingBalance ?? 0
    const lastWageringRequired = lastTransaction?.wageringRequired ?? 0

    if (lastBalance < amount) {
      throw new BadRequestException({
        message: 'Недостаточно гемов',
      })
    }

    if (lastWageringRequired > 0) {
      throw new BadRequestException({
        message: `Нужно отыграть еще ${formatGem(gemFloat(lastWageringRequired))}g`,
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
      wageringRequired: 0,
    })

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
