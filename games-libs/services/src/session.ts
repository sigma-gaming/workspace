import { createSingletonProxy } from '@core/di'
import {
  NotAuthenticatedException,
  SessionExpiredException,
} from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import { SessionTable, UserSelect, UserTable } from '@dbs/games-schema'
import { AccountProvider } from '@dbs/games-types'
import { Session, SessionState } from '@games/model'
import { gamesCaches } from '@games/redis'
import { parse } from 'cookie'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { Context as HonoContext } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import jwt, { TokenExpiredError, verify } from 'jsonwebtoken'
import { singleton } from 'tsyringe-neo'
import { Env, EnvService } from './env'
import { LocksService } from './locks'

type HonoEnvWithSession = {
  Variables: {
    session?: Session
  }
}

type AddSessionOptions = {
  userId: string
  provider: AccountProvider
}

@singleton()
export class SessionService {
  env: Env

  constructor(
    envService: EnvService,
    private locks: LocksService,
  ) {
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
      const verified = verify(token, this.env.jwt.secret)
      console.log(verified)
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

  getHonoSession = async <E extends HonoEnvWithSession>(
    ctx: HonoContext<E>,
  ): Promise<Session> => {
    const saved = ctx.get('session')
    if (saved) return saved

    const cookie = ctx.req.header('cookie')

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
      where: and(
        eq(SessionTable.userId, userId),
        eq(SessionTable.preventAutoDelete, false),
      ),
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

  async refreshSession<E extends HonoEnvWithSession>(
    ctx: HonoContext<E>,
    options: {
      condition: (
        session: Session & { state: SessionState.Authenticated },
      ) => boolean
    },
  ) {
    const session = ctx.get('session')

    if (session?.state !== SessionState.Authenticated) {
      return
    }

    if (!options.condition(session)) {
      return
    }

    await this.locks.with(
      [this.locks.sessionRefreshed(session.token)],
      async () => {
        const isRefreshed = await gamesCaches.sessionRefreshed.exists(
          session.token,
        )

        // Already updated in another request, skip
        if (isRefreshed) {
          return
        }

        await gamesDb
          .update(SessionTable)
          .set({ preventAutoDelete: true })
          .where(eq(SessionTable.token, session.token))

        const newSession = await this.createSession({
          userId: session.user.id,
          provider: session.provider,
        })

        this.attachSession(ctx, newSession)

        await gamesCaches.sessionRefreshed.set(session.token, true)

        /**
         * Remove the old session after 10 seconds to prevent breaking..
         * ..the concurrent requests, which have the old session token in cookies
         */
        setTimeout(() => {
          this.removeSession(session)
        }, 10_000)
      },
    )
  }

  attachSession<E extends HonoEnvWithSession>(
    ctx: HonoContext<E>,
    session: Session,
  ) {
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
      await gamesCaches.sessionRefreshed.del(session.token)
    }
  }

  detachSession<E extends HonoEnvWithSession>(ctx: HonoContext<E>) {
    deleteCookie(ctx, 'session')
    deleteCookie(ctx, 'sessionExpiresAt')
  }
}

export const sessionService = createSingletonProxy(SessionService)
