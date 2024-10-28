import { SessionState } from '@games/model'
import { sessionService } from '@games/services'
import { Hono } from 'hono'

export const logoutRoute = new Hono().post('/', async (ctx) => {
  const sessionId = sessionService.getHonoSessionId(ctx)

  if (!sessionId) {
    return ctx.json({ status: 'success' })
  }

  const sessionVariant = await sessionService.getSessionSafe(sessionId)
  sessionService.detachHonoSession(ctx)

  if (sessionId && sessionVariant.state !== SessionState.Empty) {
    await sessionService.removeSession(sessionId)
  }

  return ctx.json({ status: 'success' })
})
