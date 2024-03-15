import { gamesDb } from '@games/db'
import {
  AccountProvider,
  SessionTable,
  UserSelect,
  UserTable,
} from '@games/db-schema'
import { Session, SessionState } from '@games/model'
import { gamesCaches } from '@games/redis'
import { createSingletonProxy } from '@libs/di'
import {
  NotAuthenticatedException,
  SessionExpiredException,
} from '@libs/exceptions'
import cookie, { serialize } from 'cookie'
import { desc, eq, inArray } from 'drizzle-orm'
import { FastifyRequest } from 'fastify'
import jwt, { TokenExpiredError, verify } from 'jsonwebtoken'
import { singleton } from 'tsyringe'
import { Env, EnvService } from './env'

interface AddSessionOptions {
  userId: string
  provider: AccountProvider
}

@singleton()
export class SessionService {
  env: Env

  constructor(envService: EnvService) {
    this.env = envService.env
  }

  getSession = async (req: FastifyRequest): Promise<Session> => {
    if (!req.headers.cookie) {
      return { state: SessionState.Empty, user: null }
    }

    const { session: token } = cookie.parse(req.headers.cookie)

    if (!token) {
      return { state: SessionState.Empty, user: null }
    }

    const cached = await gamesCaches.session.get(token)

    if (cached) {
      return cached
    }

    try {
      verify(token, this.env.jwt.secret)
    } catch (error) {
      const state =
        error instanceof TokenExpiredError
          ? SessionState.Expired
          : SessionState.Empty

      return await gamesCaches.session.set(token, {
        state,
        user: null,
        token,
      })
    }

    const session = await gamesDb.query.SessionTable.findFirst({
      where: eq(SessionTable.token, token),
      with: { user: true },
    })

    if (!session) {
      return await gamesCaches.session.set(token, {
        state: SessionState.Empty,
        user: null,
      })
    }

    const created = await gamesCaches.session.set(token, {
      state: SessionState.Authenticated,
      user: session.user,
      token,
    })

    return created
  }

  getUser = (session: Session): UserSelect => {
    if (session.state === SessionState.Expired)
      throw new SessionExpiredException()
    if (session.state === SessionState.Empty)
      throw new NotAuthenticatedException()
    return session.user
  }

  getUserSafe = (session: Session): UserSelect | null => {
    if (session.state === SessionState.Expired) return null
    if (session.state === SessionState.Empty) return null
    return session.user
  }

  async createSession(options: AddSessionOptions) {
    const { userId, provider } = options

    const expiresIn = 60 * 60 * 24 * 31
    const expiresAt = new Date(Date.now() + 1000 * expiresIn)
    const token = jwt.sign({ userId }, this.env.jwt.secret, { expiresIn })

    const user = await gamesDb.query.UserTable.findFirst({
      where: eq(UserTable.id, userId),
    })

    if (!user) {
      throw new NotAuthenticatedException()
    }

    await gamesDb.insert(SessionTable).values({
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
    })

    const session: Session = {
      state: SessionState.Authenticated,
      user,
      token,
    }

    await gamesCaches.session.set(token, session)

    const extraSessions = await gamesDb.query.SessionTable.findMany({
      where: eq(SessionTable.userId, userId),
      orderBy: desc(SessionTable.expiresAt),
      offset: 5, // Max 5 sessions per user
    })

    if (extraSessions.length > 0) {
      await gamesDb.delete(SessionTable).where(
        inArray(
          SessionTable.id,
          extraSessions.map((s) => s.id),
        ),
      )
    }

    const cookie = [
      serialize('session', token, {
        domain: this.env.domain,
        path: '/',
        expires: expiresAt,
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
      }),
      serialize('sessionExpiresAt', expiresAt.toISOString(), {
        domain: this.env.domain,
        path: '/',
        expires: expiresAt,
        sameSite: 'lax',
        secure: true,
      }),
      serialize('lastSocialProviderUsed', provider, {
        domain: this.env.domain,
        path: '/',
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 31 * 365),
        sameSite: 'lax',
        secure: true,
      }),
    ]

    return { cookie, session }
  }

  async removeSession(session: Session) {
    if (session.token) {
      try {
        await gamesDb
          .delete(SessionTable)
          .where(eq(SessionTable.token, session.token))
      } catch {
        // Session doesn't exist
      }

      await gamesCaches.session.del(session.token)
    }

    const cookie = [
      serialize('session', '', {
        domain: this.env.domain,
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
      }),
      serialize('sessionExpiresAt', '', {
        domain: this.env.domain,
        path: '/',
        expires: new Date(0),
        sameSite: 'lax',
        secure: true,
      }),
    ]

    return { cookie }
  }
}

export const sessionService = createSingletonProxy(SessionService)
