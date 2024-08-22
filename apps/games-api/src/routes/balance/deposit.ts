import { TransactionType } from '@dbs/games-types'
import { locks, sessionService, transactionService } from '@games/services'
import { createRouter } from '../../hono'

export const depositRoute = createRouter().post('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const amount = 1000000

  return locks.with([locks.transaction(user.id)], async () => {
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
  })
})
