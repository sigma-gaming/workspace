import { notificationService, sessionService } from '@games/services'
import { createRouter } from '../../app/router'

export const getActualRoute = createRouter().get('/', async (ctx) => {
  const { session } = await sessionService.getHonoSessionSafe(ctx)
  const actual = await notificationService.getActual(session?.userId)
  return ctx.json(actual)
})
