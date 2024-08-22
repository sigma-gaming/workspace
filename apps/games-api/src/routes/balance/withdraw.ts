import { BadRequestException, InternalServerException } from '@core/exceptions'
import { FraudRisk, TransactionType } from '@dbs/games-types'
import { formatGem, gemFloat } from '@games/model'
import {
  fraudService,
  locks,
  sessionService,
  transactionService,
} from '@games/services'
import { createRouter } from '../../hono'

export const withdrawRoute = createRouter().post('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const amount = 1000000

  return await locks.with([locks.transaction(user.id)], async () => {
    const risk = await fraudService.actualizeRisk(user.id, { ctx })

    if (risk === FraudRisk.High) {
      throw new BadRequestException({
        message: 'Не удалось произвести вывод. Попробуйте позже',
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

    const [newTransaction] = await transactionService.createTransaction({
      payload: transactionService.generateTransaction(lastTransaction, {
        userId: user.id,
        type: TransactionType.Withdrawal,
        amount: -amount,
      }),
    })

    return ctx.json({
      status: 'success',
      updatedBalance: newTransaction.closingBalance,
    })
  })
})
