import { sessionService } from '@games/services'
import { createMiddleware } from 'hono/factory'
import { GamesApiEnv } from '../hono'

export const sessionMiddleware = createMiddleware<GamesApiEnv>(
  async (ctx, next) => {
    const session = await sessionService.getHonoSession(ctx)
    const user = sessionService.getUserSafe(session)
    ctx.set('session', session)
    ctx.set('user', user)
    await next()
  },
)
