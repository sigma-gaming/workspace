import { SessionState } from '@games/model'
import { sessionService } from '@games/services'
import { Hono } from 'hono'
import { deleteCookie } from 'hono/cookie'
import { serverEnv } from '../../shared/env/server'
import { getSessionToken, getSessionVariant } from '../session'

export const logoutRoute = new Hono().post('/', async (ctx) => {
  const sessionToken = getSessionToken(ctx)

  if (!sessionToken) {
    return ctx.json({ status: 'success' })
  }

  const sessionVariant = getSessionVariant(sessionToken)

  deleteCookie(ctx, 'session_token', {
    domain: serverEnv.authApi.domain,
    path: '/',
    sameSite: 'none',
    httpOnly: true,
    secure: true,
  })

  if (sessionToken && sessionVariant.state !== SessionState.Empty) {
    await sessionService.removeSession(sessionToken)
  }

  return ctx.json({ status: 'success' })
})
