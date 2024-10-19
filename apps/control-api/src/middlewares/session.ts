import { NotAuthenticatedException } from '@core/exceptions'
import { sessionService } from '@games/services'
import { createMiddleware } from 'hono/factory'
import { ControlApiEnv } from '../hono'

export const sessionMiddleware = createMiddleware<ControlApiEnv>(
  async (ctx, next) => {
    const token = sessionService.getHonoToken(ctx)
    if (!token) throw new NotAuthenticatedException()
    const session = await sessionService.getSession(token)
    ctx.set('session', session)
    await next()
  },
)
