import { sessionService, transactionService } from '@games/services'
import { Hono } from 'hono'

export const getDetailedBalanceRoute = new Hono().get('/', async (ctx) => {
  const session = await sessionService.getHonoSession(ctx.req)
  const user = sessionService.getUser(session)

  const recentTransaction = await transactionService.getLastTransaction(user.id)

  if (!recentTransaction) {
    return ctx.json({ available: 0 })
  }

  return ctx.json({ available: recentTransaction.closingBalance })
})
