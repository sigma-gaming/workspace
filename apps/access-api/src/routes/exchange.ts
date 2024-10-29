import { BadRequestException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { SessionState } from '@games/model'
import { gamesCaches } from '@games/redis'
import { sessionService } from '@games/services'
import { z } from 'zod'
import { env } from '../env'
import { createRouter } from '../hono'

export const exchangeRoute = createRouter().get(
  '/',
  zValidator(
    'query',
    z.object({
      code: z.string(),
      returnUrl: z.string().url(),
    }),
  ),
  async (ctx) => {
    const { code, returnUrl } = ctx.req.valid('query')
    const sessionId = await gamesCaches.sessionCodeToSessionId.get(code)

    if (!sessionId) {
      throw new BadRequestException({
        message: 'Код авторизации истёк или не существует, повторите вход',
      })
    }

    const variant = await sessionService.getSessionSafe(sessionId)

    if (variant.state !== SessionState.Authenticated) {
      throw new BadRequestException({
        message: 'Сессия истекла или не существует, повторите вход',
      })
    }

    const { hostname } = new URL(returnUrl)

    if (
      hostname !== env.access.domain &&
      !hostname.endsWith('.' + env.access.domain)
    ) {
      ctx.status(400)
      return ctx.text('Invalid return URL')
    }

    await gamesCaches.sessionCodeToSessionId.del(code)
    sessionService.attachHonoSession(ctx, variant.session)
    return ctx.redirect(returnUrl)
  },
)
