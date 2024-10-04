import { affiliateService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const isConnectedRoute = createRouter().get('/', async (ctx) => {
  const session = ctx.get('session')
  const user = sessionService.getUser(session)
  const settings = await affiliateService.getReferrerSettings(user.id)

  return ctx.json({ isConnected: Boolean(settings) })
})
