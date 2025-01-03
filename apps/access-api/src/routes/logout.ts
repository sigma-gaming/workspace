import { zValidator } from '@core/server'
import { sessionService } from '@games/services'
import { z } from 'zod'
import { createRouter } from '../app/router'
import { limitByIp } from '../middlewares/limit-by-ip'

export const logoutRoute = createRouter().get(
  '/',
  limitByIp({ limit: 5, windowMs: 60 * 1000 }),
  zValidator('query', z.object({ returnUrl: z.string().url() })),
  async (ctx) => {
    const sessionId = sessionService.getHonoSessionId(ctx)
    const { session } = await sessionService.getSessionSafe(sessionId)

    const { returnUrl } = ctx.req.valid('query')

    const { hostname } = new URL(returnUrl)
    const domain = sessionService.getBaseDomain(ctx)

    if (hostname !== domain && !hostname.endsWith('.' + domain)) {
      ctx.status(400)
      return ctx.text('Invalid return URL')
    }

    if (session) {
      await sessionService.removeSession(session.id)
    }

    sessionService.detachHonoSession(ctx)
    return ctx.redirect(returnUrl)
  },
)
