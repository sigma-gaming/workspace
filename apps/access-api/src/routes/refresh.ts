import { BadRequestException } from '@core/exceptions'
import { limitByIp } from '@core/server-bun'
import { SessionState } from '@games/model'
import { sessionService } from '@games/services'
import { createRouter } from '../app/router'

export const refreshRoute = createRouter().post(
  '/',
  limitByIp({ limit: 1, windowMs: 15 * 60 * 1000 }),
  async (ctx) => {
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
  },
)
