import { zValidator } from '@core/server'
import { deleteCookie } from 'hono/cookie'
import { z } from 'zod'
import { env } from '../env'
import { createRouter } from '../hono'

export const logoutRoute = createRouter().get(
  '/',
  zValidator('query', z.object({ returnUrl: z.string().url() })),
  async (ctx) => {
    const { returnUrl } = ctx.req.valid('query')
    const { hostname } = new URL(returnUrl)

    if (
      hostname !== env.access.domain &&
      !hostname.endsWith('.' + env.access.domain)
    ) {
      ctx.status(400)
      return ctx.text('Invalid return URL')
    }

    deleteCookie(ctx, 'session_token', {
      domain: env.access.domain,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    })

    deleteCookie(ctx, 'session_expires_at', {
      domain: env.access.domain,
      path: '/',
      sameSite: 'lax',
      secure: true,
    })

    return ctx.redirect(returnUrl)
  },
)
