import { BadRequestException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { SessionState } from '@games/model'
import { gamesCaches } from '@games/redis'
import { sessionService } from '@games/services'
import { setCookie } from 'hono/cookie'
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
    const token = await gamesCaches.sessionCodeToToken.get(code)

    if (!token) {
      throw new BadRequestException({
        message: 'Код авторизации истёк или не существует, повторите вход',
      })
    }

    const variant = sessionService.getSessionVariant(token)

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

    const { expiresAt } = variant.session

    setCookie(ctx, 'session_token', token, {
      domain: env.access.domain,
      path: '/',
      expires: new Date(expiresAt),
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    })

    setCookie(ctx, 'session_expires_at', expiresAt, {
      domain: env.access.domain,
      path: '/',
      expires: new Date(expiresAt),
      sameSite: 'lax',
      secure: true,
    })

    return ctx.redirect(returnUrl)
  },
)
