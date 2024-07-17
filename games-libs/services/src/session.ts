import { createSingletonProxy } from '@core/di'
import {
  NotAuthenticatedException,
  SessionExpiredException,
} from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import {
  AccountProvider,
  SessionTable,
  UserSelect,
  UserTable,
} from '@dbs/games-schema'
import { Session, SessionState } from '@games/model'
import { gamesCaches } from '@games/redis'
import { parse } from 'cookie'
import { desc, eq, inArray } from 'drizzle-orm'
import { Context as HonoContext, HonoRequest } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import jwt, { TokenExpiredError, verify } from 'jsonwebtoken'
import { singleton } from 'tsyringe-neo'
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

  getSession = async (token?: string): Promise<Session> => {
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
      expiresAt: session.expiresAt,
      provider: session.provider,
    })

    return created
  }

  getHonoSession = async (req: HonoRequest): Promise<Session> => {
    const cookie = req.header('cookie')

    if (!cookie) {
      return { state: SessionState.Empty, user: null }
    }

    const { session: token } = parse(cookie)

    return this.getSession(token)
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
      provider,
    })

    const session: Session = {
      state: SessionState.Authenticated,
      user,
      token,
      expiresAt: expiresAt.toISOString(),
      provider,
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

    return session
  }

  attachSession(ctx: HonoContext, session: Session) {
    if (session.state !== SessionState.Authenticated) {
      return
    }

    const expires = new Date(session.expiresAt)

    setCookie(ctx, 'session', session.token, {
      domain: this.env.domain,
      path: '/',
      expires,
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    })

    setCookie(ctx, 'sessionExpiresAt', session.expiresAt, {
      domain: this.env.domain,
      path: '/',
      expires,
      sameSite: 'lax',
      secure: true,
    })

    setCookie(ctx, 'lastSocialProviderUsed', session.provider, {
      domain: this.env.domain,
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      sameSite: 'lax',
      secure: true,
    })
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
  }

  detachSession(ctx: HonoContext) {
    deleteCookie(ctx, 'session')
    deleteCookie(ctx, 'sessionExpiresAt')
  }
}

export const sessionService = createSingletonProxy(SessionService)
