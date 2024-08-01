import { sessionService } from '@games/services'
import { Hono } from 'hono'

export const logoutRoute = new Hono().post('/', async (ctx) => {
  const session = await sessionService.getHonoSession(ctx)

  await sessionService.removeSession(session)
  sessionService.detachSession(ctx)

  return ctx.json({ status: 'success' })
})
