import { zValidator } from '@core/server'
import { limitByIp } from '@core/server-bun'
import { SessionState } from '@games/model'
import { gamesCache, sessionService } from '@games/services'
import { z } from 'zod'
import { createRouter } from '../app/router'

export const exchangeRoute = createRouter().get(
  '/',
  limitByIp({ limit: 5, windowMs: 60 * 1000 }),
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
    const domain = sessionService.getBaseDomain(ctx)

    if (hostname !== domain && !hostname.endsWith('.' + domain)) {
      ctx.status(400)
      return ctx.text('Некорретный URL возврата')
    }

    await gamesCache.sessionCodeToSessionId.del(code)
    sessionService.attachHonoSession(ctx, variant.session)
    return ctx.redirect(returnUrl)
  },
)
