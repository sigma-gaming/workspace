import { notificationService, sessionService } from '@games/services'
import { Hono } from 'hono'

export const getActualRoute = new Hono().get('/', async (ctx) => {
  const session = await sessionService.getHonoSession(ctx.req)
  const user = sessionService.getUserSafe(session)
  const actual = await notificationService.getActual(user?.id)
  return ctx.json(actual)
})
