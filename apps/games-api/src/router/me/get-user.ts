import { sessionService } from '@games/services'
import { Hono } from 'hono'

export const getUserRoute = new Hono().get('/', async (ctx) => {
  const session = await sessionService.getSession(ctx.req)
  const user = sessionService.getUser(session)
  return ctx.json(user)
})
