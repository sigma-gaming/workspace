import { affiliateService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const isConnectedRoute = createRouter().get('/', async (ctx) => {
  const { userId } = sessionService.getHonoSession(ctx)
  const settings = await affiliateService.getReferrerSettings(userId)

  return ctx.json({ isConnected: Boolean(settings) })
})
