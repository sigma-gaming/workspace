import { env } from '@shared/env'
import {
  NotAuthenticatedException,
  SessionExpiredException,
} from '@sigma/exceptions'
import { AccountProvider, User } from '@sigma/games-model'
import cookie, { serialize } from 'cookie'
import { FastifyRequest } from 'fastify'
import jwt, { TokenExpiredError, verify } from 'jsonwebtoken'
import { prisma } from '../shared/db'

enum SessionState {
  Empty,
  Expired,
  Authenticated,
}

export type Session =
  | { state: SessionState.Authenticated; user: User }
  | { state: SessionState.Empty; user: null }
  | { state: SessionState.Expired; user: null }

export const getSession = async (req: FastifyRequest): Promise<Session> => {
  if (!req.headers.cookie) {
    return { state: SessionState.Empty, user: null }
  }

  const { session } = cookie.parse(req.headers.cookie)

  try {
    verify(session, env.jwt.secret)
  } catch (error) {
    const state =
      error instanceof TokenExpiredError
        ? SessionState.Expired
        : SessionState.Empty

    return { state, user: null }
  }

  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: session },
      },
    },
  })

  if (!user) {
    return { state: SessionState.Empty, user: null }
  }

  return { state: SessionState.Authenticated, user }
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

  const session = await prisma.session.create({
    data: { userId, token, expiresAt },
  })

  const extraSessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { expiresAt: 'desc' },
    skip: 5, // Max 5 sessions per user
  })

  if (extraSessions.length > 0) {
    await prisma.session.deleteMany({
      where: {
        id: { in: extraSessions.map((s) => s.id) },
      },
    })
  }

  const cookie = [
    serialize('session', token, {
      domain: env.domain,
      path: '/',
      expires: session.expiresAt,
      httpOnly: true,
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

  return { cookie }
}

export const SessionService = {
  createSession,
  getSession,
  getUser,
}
