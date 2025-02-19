import { NotAuthenticatedException } from '@core/exceptions'
import { SessionSelect } from '@dbs/games-schema'
import { sessionService } from '@games/services'
import { createMiddleware } from 'hono/factory'

export const sessionMiddleware = createMiddleware<{
  Variables: {
    session: SessionSelect
  }
}>(async (ctx, next) => {
  const sessionId = sessionService.getHonoSessionId(ctx)
  if (!sessionId) throw new NotAuthenticatedException()
  const session = await sessionService.getSession(sessionId)
  ctx.set('session', session)
  await next()
})
