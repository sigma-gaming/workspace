import { zValidator } from '@core/server'
import { sessionService } from '@games/services'
import { z } from 'zod'
import { createRouter } from '../app/router'
import { env } from '../env'

export const logoutRoute = createRouter().get(
  '/',
  zValidator('query', z.object({ returnUrl: z.string().url() })),
  async (ctx) => {
    const sessionId = sessionService.getHonoSessionId(ctx)
    const { session } = await sessionService.getSessionSafe(sessionId)

    const { returnUrl } = ctx.req.valid('query')
    const { hostname } = new URL(returnUrl)

    if (
      hostname !== env.access.domain &&
      !hostname.endsWith('.' + env.access.domain)
    ) {
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
