import { BadRequestException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { SessionState } from '@games/model'
import { gamesCaches } from '@games/redis'
import { sessionService } from '@games/services'
import { setCookie } from 'hono/cookie'
import { z } from 'zod'
import { env } from '../../env'
import { createRouter } from '../../hono'

export const exchangeCodeRoute = createRouter().post(
  '/',
  zValidator('json', z.object({ code: z.string() })),
  async (ctx) => {
    const { code } = ctx.req.valid('json')
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

    const { expiresAt } = variant.session

    setCookie(ctx, 'session_token', token, {
      domain: env.domain,
      path: '/',
      expires: new Date(expiresAt),
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    })

    setCookie(ctx, 'session_expires_at', expiresAt, {
      domain: env.domain,
      path: '/',
      expires: new Date(expiresAt),
      sameSite: 'lax',
      secure: true,
    })

    return ctx.status(200)
  },
)
