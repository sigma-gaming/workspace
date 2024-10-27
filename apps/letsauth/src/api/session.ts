import 'reflect-metadata'
import './setup'
import { SessionState, SessionTokenPayload } from '@games/model'
import { parse } from 'cookie'
import { Context } from 'hono'
import jwt from 'jsonwebtoken'
import { serverEnv } from '../shared/env/server'

export function getSessionToken(ctx: Context): string | null {
  const cookie = ctx.req.header('cookie')
  if (!cookie) return null
  const { session_token } = parse(cookie)
  return session_token ?? null
}

export type SessionVariant =
  | {
      state: SessionState.Authenticated
      payload: SessionTokenPayload
      sessionExpiresAt: Date
    }
  | { state: SessionState.Expired; payload: null }
  | { state: SessionState.Empty; payload: null }

export function getSessionVariant(
  sessionToken?: string | null,
): SessionVariant {
  if (!sessionToken) {
    return { state: SessionState.Empty, payload: null }
  }

  try {
    type Verified = SessionTokenPayload & { exp: number; iat: number }
    const verified = jwt.verify(sessionToken, serverEnv.jwt.secret) as Verified
    const { exp, iat, ...payload } = verified

    return {
      state: SessionState.Authenticated,
      payload,
      sessionExpiresAt: new Date(exp * 1000),
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { state: SessionState.Expired, payload: null }
    }

    return { state: SessionState.Empty, payload: null }
  }
}
