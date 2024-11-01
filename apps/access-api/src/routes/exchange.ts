import { zValidator } from '@core/server'
import { SessionState } from '@games/model'
import { gamesCache, sessionService } from '@games/services'
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

    if (!gamesCache.ready) {
      ctx.status(503)
      return ctx.text('Сервис временно недоступен, повторите попытку позже')
    }

    const sessionId = await gamesCache.sessionCodeToSessionId.get(code)

    if (!sessionId) {
      ctx.status(400)
      return ctx.text('Код авторизации истёк или не существует, повторите вход')
    }

    const variant = await sessionService.getSessionSafe(sessionId)

    if (variant.state !== SessionState.Authenticated) {
      ctx.status(400)
      return ctx.text('Сессия истекла или не существует, повторите вход')
    }

    const { hostname } = new URL(returnUrl)

    if (
      hostname !== env.access.domain &&
      !hostname.endsWith('.' + env.access.domain)
    ) {
      ctx.status(400)
      return ctx.text('Некорретный URL возврата')
    }

    await gamesCache.sessionCodeToSessionId.del(code)
    sessionService.attachHonoSession(ctx, variant.session)
    return ctx.redirect(returnUrl)
  },
)
