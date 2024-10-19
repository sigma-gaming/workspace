import { notificationService, sessionService } from '@games/services'
import { createRouter } from '../../hono'

export const getActualRoute = createRouter().get('/', async (ctx) => {
  const { session } = sessionService.getHonoSessionVariant(ctx)
  const actual = await notificationService.getActual(session?.userId)
  return ctx.json(actual)
})
