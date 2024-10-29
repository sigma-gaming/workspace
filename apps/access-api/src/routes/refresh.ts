import { BadRequestException } from '@core/exceptions'
import { SessionState } from '@games/model'
import { sessionService } from '@games/services'
import { createRouter } from '../hono'

export const refreshRoute = createRouter().post('/', async (ctx) => {
  const sessionId = sessionService.getHonoSessionId(ctx)
  const variant = await sessionService.getSessionSafe(sessionId)

  if (variant.state !== SessionState.Authenticated) {
    throw new BadRequestException({
      message: 'Сессия истекла или не существует',
    })
  }

  const { session } = variant
  const refreshed = await sessionService.refreshSession(session.id)
  sessionService.attachHonoSession(ctx, refreshed)

  return ctx.json({ expiresAt: refreshed.expiresAt })
})
