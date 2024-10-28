import { NotAuthenticatedException } from '@core/exceptions'
import { sessionService } from '@games/services'
import { createMiddleware } from 'hono/factory'
import { ControlApiEnv } from '../hono'

export const sessionMiddleware = createMiddleware<ControlApiEnv>(
  async (ctx, next) => {
    const sessionId = sessionService.getHonoSessionId(ctx)
    if (!sessionId) throw new NotAuthenticatedException()
    const session = await sessionService.getSession(sessionId)
    ctx.set('session', session)
    await next()
  },
)
