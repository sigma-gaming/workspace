import {
  NotAuthenticatedException,
  SessionExpiredException,
} from '@libs/exceptions'
import { Sessions, User } from '@libs/games-db-schema'
import cookie from 'cookie'
import { eq } from 'drizzle-orm'
import { FastifyRequest } from 'fastify'
import { TokenExpiredError, verify } from 'jsonwebtoken'
import { sessionCache } from '../caches/session'
import { db } from '../shared/db'
import { env } from '../shared/env'

enum SessionState {
  Empty,
  Expired,
  Authenticated,
}

export type Session =
  | { state: SessionState.Authenticated; user: User; token: string }
  | { state: SessionState.Expired; user: null; token: string }
  | { state: SessionState.Empty; user: null; token?: string }

export const getSession = async (req: FastifyRequest): Promise<Session> => {
  if (!req.headers.cookie) {
    return { state: SessionState.Empty, user: null }
  }

  const { session: token } = cookie.parse(req.headers.cookie)

  if (!token) {
    return { state: SessionState.Empty, user: null }
  }

  const cached = await sessionCache.get(token)

  if (cached) {
    return cached
  }

  try {
    verify(token, env.jwt.secret)
  } catch (error) {
    const state =
      error instanceof TokenExpiredError
        ? SessionState.Expired
        : SessionState.Empty

    return await sessionCache.set(token, {
      state,
      user: null,
      token,
    })
  }

  const user = await db.query.Users.findFirst({
    with: {
      sessions: {
        where: eq(Sessions.token, token),
      },
    },
  })

  if (!user) {
    return await sessionCache.set(token, {
      state: SessionState.Empty,
      user: null,
    })
  }

  return await sessionCache.set(token, {
    state: SessionState.Authenticated,
    user,
    token,
  })
}

export const getUser = (session: Session): User => {
  if (session.state === SessionState.Expired)
    throw new SessionExpiredException()
  if (session.state === SessionState.Empty)
    throw new NotAuthenticatedException()
  return session.user
}

export const SessionService = {
  getSession,
  getUser,
}
