import { createSingletonProxy } from '@core/di'
import {
  NotAuthenticatedException,
  SessionExpiredException,
} from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import { SessionTable } from '@dbs/games-schema'
import {
  AccessTokenPayload,
  Session,
  SessionState,
  SessionTokenPayload,
  SessionVariant,
} from '@games/model'
import { gamesCaches } from '@games/redis'
import { parse } from 'cookie'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { Context as HonoContext } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import jwt from 'jsonwebtoken'
import { inject, InjectionToken, singleton } from 'tsyringe-neo'
import { userService } from './user'

type HonoEnvWithSession = {
  Variables: {
    sessionVariant?: SessionVariant
  }
}

export type SessionOptions = {
  domain: string
  jwt: { secret: string }
}

export const SessionOptionsToken: InjectionToken<SessionOptions> = Symbol(
  'SessionOptionsToken',
)

@singleton()
export class SessionService {
  constructor(@inject(SessionOptionsToken) private options: SessionOptions) {}

  getHonoToken(ctx: HonoContext): string | null {
    const cookie = ctx.req.header('cookie')
    if (!cookie) return null
    const parsed = parse(cookie)
    return parsed.session_token ?? null
  }

  getSessionVariant(token?: string | null): SessionVariant {
    if (!token) {
      return { state: SessionState.Empty, session: null }
    }

    try {
      type Verified = AccessTokenPayload & { exp: number; iat: number }
      const verified = jwt.verify(token, this.options.jwt.secret) as Verified
      const { exp, iat, ...payload } = verified
      const expiresAt = new Date(exp * 1000).toISOString()
      const session: Session = { ...payload, token, expiresAt }
      return { state: SessionState.Authenticated, session }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { state: SessionState.Expired, session: null }
      }

      return { state: SessionState.Empty, session: null }
    }
  }

  getSession = async (token?: string): Promise<Session> => {
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

    const token = this.getHonoToken(ctx)
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

  async createSession(payload: SessionTokenPayload) {
    const { userId } = payload

    const expiresIn = 60 * 60 * 24 * 31
    const expiresAt = new Date(Date.now() + 1000 * expiresIn).toISOString()

    const token = jwt.sign(payload, this.options.jwt.secret, {
      expiresIn,
    })

    const user = await userService.getUserSafe(userId)

    if (!user) {
      throw new NotAuthenticatedException()
    }

    await gamesDb.insert(SessionTable).values({
      userId,
      token,
      expiresAt,
      provider: payload.provider,
    })

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

    return { token, expiresAt }
  }

  async removeSession(token: string) {
    await gamesDb.delete(SessionTable).where(eq(SessionTable.token, token))
    await gamesCaches.sessionRefreshing.del(token)
  }

  // async refreshSession<E extends HonoEnvWithSession>(
  //   ctx: HonoContext<E>,
  //   options: {
  //     condition: (session: Session) => boolean
  //   },
  // ) {
  //   const variant = this.getHonoSessionVariant(ctx)

  //   if (variant.state !== SessionState.Authenticated) {
  //     return
  //   }

  //   const session = variant.session

  //   if (!options.condition(session)) {
  //     return
  //   }

  //   await this.locks.with(
  //     [this.locks.sessionRefreshed(session.token)],
  //     async () => {
  //       const isRefreshed = await gamesCaches.sessionRefreshing.exists(
  //         session.token,
  //       )

  //       // Already updated in another request, skip
  //       if (isRefreshed) {
  //         return
  //       }

  //       await gamesDb
  //         .update(SessionTable)
  //         .set({ preventAutoDelete: true })
  //         .where(eq(SessionTable.token, session.token))

  //       const newSession = await this.createSession(session)

  //       this.attachSession(ctx, newSession)

  //       await gamesCaches.sessionRefreshing.set(session.token, true)

  //       /**
  //        * Remove the old session after 10 seconds to prevent breaking..
  //        * ..the concurrent requests, which have the old session token in cookies
  //        */
  //       setTimeout(() => {
  //         this.removeSession(session)
  //       }, 10_000)
  //     },
  //   )
  // }

  attachSession(ctx: HonoContext, session: Session) {
    const expires = new Date(session.expiresAt)

    setCookie(ctx, 'session', session.token, {
      domain: this.options.domain,
      path: '/',
      expires,
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    })

    setCookie(ctx, 'sessionExpiresAt', session.expiresAt, {
      domain: this.options.domain,
      path: '/',
      expires,
      sameSite: 'lax',
      secure: true,
    })

    setCookie(ctx, 'lastSocialProviderUsed', session.provider, {
      domain: this.options.domain,
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
      sameSite: 'lax',
      secure: true,
    })
  }

  detachSession(ctx: HonoContext) {
    deleteCookie(ctx, 'session', {
      domain: this.options.domain,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })

    deleteCookie(ctx, 'sessionExpiresAt', {
      domain: this.options.domain,
      path: '/',
      sameSite: 'lax',
    })
  }
}

export const sessionService = createSingletonProxy(SessionService)
