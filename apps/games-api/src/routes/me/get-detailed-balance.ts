import { balanceService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getDetailedBalanceRoute = createRouter().get('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)

  const { available } = await balanceService.getBalance(user.id)

  return ctx.json({ available })
})
