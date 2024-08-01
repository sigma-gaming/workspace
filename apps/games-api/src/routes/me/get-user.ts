import { sessionService } from '@games/services'
import { Hono } from 'hono'

export const getUserRoute = new Hono().get('/', async (ctx) => {
  const session = await sessionService.getHonoSession(ctx)
  const user = sessionService.getUser(session)
  return ctx.json(user)
})
