import { NotAuthenticatedException } from '@core/exceptions'
import { sessionService } from '@games/services'
import { parse } from 'cookie'
import { createMiddleware } from 'hono/factory'
import { ControlApiEnv } from '../hono'

export const sessionMiddleware = createMiddleware<ControlApiEnv>(
  async (ctx, next) => {
    const cookie = ctx.req.header('cookie')
    if (!cookie) throw new NotAuthenticatedException()
    const { session: token } = parse(cookie)
    const session = await sessionService.getSession(token)
    ctx.set('session', session)
    await next()
  },
)
