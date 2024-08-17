import { notificationService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getActualRoute = createRouter().get('/', async (ctx) => {
  const session = await sessionService.getHonoSession(ctx)
  const user = sessionService.getUserSafe(session)
  const actual = await notificationService.getActual(user?.id)
  return ctx.json(actual)
})
