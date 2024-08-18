import { InternalServerException, RouteException } from '@core/exceptions'
import { TransactionType } from '@dbs/games-types'
import { gamesCaches } from '@games/redis'
import { sessionService, transactionService } from '@games/services'
import { createRouter } from '../../hono'

export const depositRoute = createRouter().post('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const amount = 1000000

  const lock = await gamesCaches.lastTransaction.lock(user.id, 10000)

  try {
    const lastTransaction = await transactionService.getLastTransaction(user.id)

    const [newTransaction] = await transactionService.createTransaction({
      payload: transactionService.generateTransaction(lastTransaction, {
        userId: user.id,
        type: TransactionType.Deposit,
        amount,
      }),
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
