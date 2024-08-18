import { sessionService } from '@games/services'
import { createMiddleware } from 'hono/factory'
import { ControlApiEnv } from '../hono'

export const sessionMiddleware = createMiddleware<ControlApiEnv>(
  async (ctx, next) => {
    const session = await sessionService.getHonoSession(ctx)
    const user = sessionService.getUser(session)
    ctx.set('session', session)
    ctx.set('user', user)
    await next()
  },
)
