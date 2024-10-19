import { createSingletonProxy } from '@core/di'
import {
  NotAuthenticatedException,
  SessionExpiredException,
} from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import { SessionTable } from '@dbs/games-schema'
import {
  Session,
  SessionPayload,
  SessionState,
  SessionVariant,
} from '@games/model'
import { gamesCaches } from '@games/redis'
import { parse } from 'cookie'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { Context as HonoContext } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import jwt, { TokenExpiredError } from 'jsonwebtoken'
import { singleton } from 'tsyringe-neo'
import { Env, EnvService } from './env'
import { LocksService } from './locks'
import { userService } from './user'

type HonoEnvWithSession = {
  Variables: {
    sessionVariant?: SessionVariant
  }
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

  getSessionVariant(token: string): SessionVariant {
    try {
      type Verified = SessionPayload & { exp: number; iat: number }
      const verified = jwt.verify(token, this.env.jwt.secret) as Verified
      const { exp, iat, ...payload } = verified
      const expiresAt = new Date(exp * 1000).toISOString()
      const session: Session = { ...payload, token, expiresAt }
      return { state: SessionState.Authenticated, session }
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return { state: SessionState.Expired, session: null }
      }

      return { state: SessionState.Empty, session: null }
    }
  }

  getSession = async (token?: string): Promise<Session> => {
    if (!token) {
      throw new NotAuthenticatedException()
    }

    const variant = this.getSessionVariant(token)

    if (variant.state === SessionState.Expired)
      throw new SessionExpiredException()
    if (variant.state === SessionState.Empty)
      throw new NotAuthenticatedException()

    return variant.session
  }

  getHonoSessionVariant = <E extends HonoEnvWithSession>(
    ctx: HonoContext<E>,
  ): SessionVariant => {
    const saved = ctx.get('sessionVariant')
    if (saved) return saved

    const cookie = ctx.req.header('cookie')

    if (!cookie) {
      return { state: SessionState.Empty, session: null }
    }

    const { session: token } = parse(cookie)

    const variant = this.getSessionVariant(token)
    ctx.set('sessionVariant', variant)
    return variant
  }

  getHonoSession = <E extends HonoEnvWithSession>(ctx: HonoContext<E>) => {
    const variant = this.getHonoSessionVariant(ctx)
    if (variant.state === SessionState.Expired)
      throw new SessionExpiredException()
    if (variant.state === SessionState.Empty)
      throw new NotAuthenticatedException()
    return variant.session
  }

  async createSession(payload: SessionPayload): Promise<Session> {
    const { userId } = payload

    const expiresIn = 60 * 60 * 24 * 31
    const expiresAt = new Date(Date.now() + 1000 * expiresIn)
    const token = jwt.sign(payload, this.env.jwt.secret, { expiresIn })

    const user = await userService.getUserSafe(userId)

    if (!user) {
      throw new NotAuthenticatedException()
    }

    await gamesDb.insert(SessionTable).values({
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
      provider: payload.provider,
    })

    const session: Session = {
      ...payload,
      token,
      expiresAt: expiresAt.toISOString(),
    }

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

  async removeSession(session: Session) {
    if (session.token) {
      try {
        await gamesDb
          .delete(SessionTable)
          .where(eq(SessionTable.token, session.token))
      } catch {
        // Session doesn't exist
      }

      await gamesCaches.user.del(session.token)
      await gamesCaches.sessionRefreshing.del(session.token)
    }
  }

  async refreshSession<E extends HonoEnvWithSession>(
    ctx: HonoContext<E>,
    options: {
      condition: (session: Session) => boolean
    },
  ) {
    const variant = this.getHonoSessionVariant(ctx)

    if (variant.state !== SessionState.Authenticated) {
      return
    }

    const session = variant.session

    if (!options.condition(session)) {
      return
    }

    await this.locks.with(
      [this.locks.sessionRefreshed(session.token)],
      async () => {
        const isRefreshed = await gamesCaches.sessionRefreshing.exists(
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

        const newSession = await this.createSession(session)

        this.attachSession(ctx, newSession)

        await gamesCaches.sessionRefreshing.set(session.token, true)

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

  detachSession<E extends HonoEnvWithSession>(ctx: HonoContext<E>) {
    deleteCookie(ctx, 'session', {
      domain: this.env.domain,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })

    deleteCookie(ctx, 'sessionExpiresAt', {
      domain: this.env.domain,
      path: '/',
      sameSite: 'lax',
    })
  }
}

export const sessionService = createSingletonProxy(SessionService)
