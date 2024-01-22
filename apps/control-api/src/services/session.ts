import {
  NotAuthenticatedException,
  SessionExpiredException,
} from '@libs/exceptions'
import { User } from '@libs/games-model'
import cookie from 'cookie'
import { FastifyRequest } from 'fastify'
import { TokenExpiredError, verify } from 'jsonwebtoken'
import { sessionCache } from '../caches/session'
import { prisma } from '../shared/db'
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

  const { session } = cookie.parse(req.headers.cookie)

  if (!session) {
    return { state: SessionState.Empty, user: null }
  }

  const cached = await sessionCache.get(session)

  if (cached) {
    return cached
  }

  try {
    verify(session, env.jwt.secret)
  } catch (error) {
    const state =
      error instanceof TokenExpiredError
        ? SessionState.Expired
        : SessionState.Empty

    return await sessionCache.set(session, {
      state,
      user: null,
      token: session,
    })
  }

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: session },
      },
    },
  })

  if (!user) {
    return await sessionCache.set(session, {
      state: SessionState.Empty,
      user: null,
    })
  }

  return await sessionCache.set(session, {
    state: SessionState.Authenticated,
    user,
    token: session,
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
