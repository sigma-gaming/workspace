import { sessionService, transactionService } from '@games/services'
import { createRouter } from '../../hono'

export const getDetailedBalanceRoute = createRouter().get('/', async (ctx) => {
  const session = await sessionService.getHonoSession(ctx)
  const user = sessionService.getUser(session)

  const recentTransaction = await transactionService.getLastTransaction(user.id)

  if (!recentTransaction) {
    return ctx.json({ available: 0 })
  }

  return ctx.json({ available: recentTransaction.closingBalance })
})
