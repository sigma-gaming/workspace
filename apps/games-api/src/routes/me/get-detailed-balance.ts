import { balanceService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getDetailedBalanceRoute = createRouter().get('/', async (ctx) => {
  const { userId } = await sessionService.getHonoSession(ctx)

  const { available } = await balanceService.getBalance(userId)

  return ctx.json({ available })
})
