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

    /**
     * Refresh session if it's close to expiration
     * Take in account only POST requests
     */

    if (ctx.req.method !== 'POST') {
      return
    }

    await sessionService.refreshSession(ctx, {
      condition: (session) => {
        const msLeft =
          new Date(session.expiresAt).getTime() - new Date().getTime()

        // Refresh if less than 7 days left until expiration
        return msLeft < 7 * 24 * 60 * 60 * 1000
      },
    })
  },
)
