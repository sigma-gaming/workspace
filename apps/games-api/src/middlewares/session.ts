import { sessionService } from '@games/services'
import { createMiddleware } from 'hono/factory'

export const sessionMiddleware = createMiddleware(async (ctx, next) => {
  const session = await sessionService.getHonoSession(ctx)
  const user = sessionService.getUserSafe(session)
  ctx.set('session', session)
  if (user) ctx.set('user', user)
  await next()
})
