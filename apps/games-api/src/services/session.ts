import {
  NotAuthenticatedException,
  SessionExpiredException,
} from '@libs/exceptions'
import { AccountProvider, Sessions, User, Users } from '@libs/games-db-schema'
import { Session, SessionState } from '@libs/games-model'
import cookie, { serialize } from 'cookie'
import { desc, eq, inArray } from 'drizzle-orm'
import { FastifyRequest } from 'fastify'
import jwt, { TokenExpiredError, verify } from 'jsonwebtoken'
import { caches } from '../shared/cache'
import { db } from '../shared/db'
import { env } from '../shared/env'

export const getSession = async (req: FastifyRequest): Promise<Session> => {
  if (!req.headers.cookie) {
    return { state: SessionState.Empty, user: null }
  }

  const { session: token } = cookie.parse(req.headers.cookie)

  if (!token) {
    return { state: SessionState.Empty, user: null }
  }

  const cached = await caches.session.get(token)

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

    return await caches.session.set(token, {
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
    return await caches.session.set(token, {
      state: SessionState.Empty,
      user: null,
    })
  }

  return await caches.session.set(token, {
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

interface AddSessionOptions {
  userId: string
  provider: AccountProvider
}

async function createSession(options: AddSessionOptions) {
  const { userId, provider } = options

  const expiresIn = 60 * 60 * 24 * 31
  const expiresAt = new Date(Date.now() + 1000 * expiresIn)
  const token = jwt.sign({ userId }, env.jwt.secret, { expiresIn })

  const user = await db.query.Users.findFirst({
    where: eq(Users.id, userId),
  })

  if (!user) {
    throw new NotAuthenticatedException()
  }

  await db
    .insert(Sessions)
    .values({
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
    })
    .returning()

  const session: Session = {
    state: SessionState.Authenticated,
    user,
    token,
  }

  await caches.session.set(token, session)

  const extraSessions = await db.query.Sessions.findMany({
    where: eq(Sessions.userId, userId),
    orderBy: desc(Sessions.expiresAt),
    offset: 5, // Max 5 sessions per user
  })

  if (extraSessions.length > 0) {
    await db.delete(Sessions).where(
      inArray(
        Sessions.id,
        extraSessions.map((s) => s.id),
      ),
    )
  }

  const cookie = [
    serialize('session', token, {
      domain: env.domain,
      path: '/',
      expires: expiresAt,
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    }),
    serialize('sessionExpiresAt', expiresAt.toISOString(), {
      domain: env.domain,
      path: '/',
      expires: expiresAt,
      sameSite: 'lax',
      secure: true,
    }),
    serialize('lastSocialProviderUsed', provider, {
      domain: env.domain,
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 31 * 365),
      sameSite: 'lax',
      secure: true,
    }),
  ]

  return { cookie, session }
}

async function removeSession(session: Session) {
  if (session.token) {
    try {
      await db.delete(Sessions).where(eq(Sessions.token, session.token))
    } catch {
      // Session doesn't exist
    }

    await caches.session.del(session.token)
  }

  const cookie = [
    serialize('session', '', {
      domain: env.domain,
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    }),
    serialize('sessionExpiresAt', '', {
      domain: env.domain,
      path: '/',
      expires: new Date(0),
      sameSite: 'lax',
      secure: true,
    }),
  ]

  return { cookie }
}

export const SessionService = {
  createSession,
  getSession,
  getUser,
  removeSession,
}
