import { createLazyInstance, resolveOptions } from '@core/di'
import {
  InternalServerException,
  NotAuthenticatedException,
  SessionExpiredException,
} from '@core/exceptions'
import { SessionSelect, SessionTable } from '@dbs/games-schema'
import { SessionState, SessionTokenPayload, SessionVariant } from '@games/model'
import { SessionOptionsToken } from '@games/options'
import { gamesDb } from '@games/services'
import { parse } from 'cookie'
import { desc, eq, inArray } from 'drizzle-orm'
import { Context as HonoContext } from 'hono'
import { deleteCookie, setCookie } from 'hono/cookie'
import { gamesCache } from './cache'
import { userService } from './user'

type HonoEnvWithSession = {
  Variables: {
    sessionVariant?: SessionVariant
  }
}

export type SessionOptions = {
  domain: string
  jwt: { secret: string }
  cookie?: {
    idKey?: string
    expiresKey?: string
  }
}

export class SessionService {
  private cookieIdKey: string
  private cookieExpiresKey: string
  private domain: string

  constructor() {
    const { domain, cookie } = resolveOptions(SessionOptionsToken)

    this.domain = domain
    this.cookieIdKey = cookie?.idKey ?? 'session_id'
    this.cookieExpiresKey = cookie?.expiresKey ?? 'session_expires_at'
  }

  private async getSessionById(
    sessionId: string,
  ): Promise<SessionSelect | null> {
    const cached = await gamesCache.session.get(sessionId)
    if (cached) return cached

    const session = await gamesDb.query.SessionTable.findFirst({
      where: eq(SessionTable.id, sessionId),
    })

    if (!session) return null
    await gamesCache.session.set(sessionId, session)
    return session
  }

  getHonoSessionId(ctx: HonoContext): string | null {
    const cookie = ctx.req.header('cookie')
    if (!cookie) return null
    const parsed = parse(cookie)
    return parsed[this.cookieIdKey] ?? null
  }

  async getSessionSafe(sessionId?: string | null): Promise<SessionVariant> {
    if (!sessionId) {
      return { state: SessionState.Empty, session: null }
    }

    const session = await this.getSessionById(sessionId)

    if (!session) {
      return { state: SessionState.Empty, session: null }
    }

    if (new Date() >= new Date(session.expiresAt)) {
      return { state: SessionState.Expired, session: null }
    }

    return { state: SessionState.Authenticated, session }
  }

  getSession = async (sessionId?: string): Promise<SessionSelect> => {
    const variant = await this.getSessionSafe(sessionId)

    if (variant.state === SessionState.Expired)
      throw new SessionExpiredException()
    if (variant.state === SessionState.Empty)
      throw new NotAuthenticatedException()

    return variant.session
  }

  async getHonoSessionSafe<E extends HonoEnvWithSession>(
    ctx: HonoContext<E>,
  ): Promise<SessionVariant> {
    const saved = ctx.get('sessionVariant')
    if (saved) return saved

    const token = this.getHonoSessionId(ctx)
    const variant = await this.getSessionSafe(token)
    ctx.set('sessionVariant', variant)
    return variant
  }

  async getHonoSession<E extends HonoEnvWithSession>(ctx: HonoContext<E>) {
    const variant = await this.getHonoSessionSafe(ctx)

    if (variant.state === SessionState.Expired)
      throw new SessionExpiredException()
    if (variant.state === SessionState.Empty)
      throw new NotAuthenticatedException()

    return variant.session
  }

  async createSession(payload: SessionTokenPayload) {
    const expiresIn = 60 * 60 * 24 * 31
    const expiresAt = new Date(Date.now() + 1000 * expiresIn).toISOString()

    const user = await userService.getUserSafe(payload.userId)

    if (!user) {
      throw new InternalServerException()
    }

    const [session] = await gamesDb
      .insert(SessionTable)
      .values({ ...payload, expiresAt })
      .returning()

    await gamesCache.session.set(session.id, session)

    const extraSessions = await gamesDb.query.SessionTable.findMany({
      where: eq(SessionTable.userId, payload.userId),
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

  async removeSession(sessionId: string) {
    await gamesDb.delete(SessionTable).where(eq(SessionTable.id, sessionId))
    await gamesCache.session.del(sessionId)
  }

  async refreshSession(sessionId: string) {
    const expiresIn = 60 * 60 * 24 * 31
    const expiresAt = new Date(Date.now() + 1000 * expiresIn).toISOString()

    const [session] = await gamesDb
      .update(SessionTable)
      .set({ expiresAt })
      .where(eq(SessionTable.id, sessionId))
      .returning()

    await gamesCache.session.set(sessionId, session)

    return session
  }

  attachHonoSession(ctx: HonoContext, session: SessionSelect) {
    const expires = new Date(session.expiresAt)

    setCookie(ctx, this.cookieIdKey, session.id, {
      domain: this.domain,
      path: '/',
      expires,
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    })

    setCookie(ctx, this.cookieExpiresKey, session.expiresAt, {
      domain: this.domain,
      path: '/',
      expires,
      sameSite: 'lax',
      secure: true,
    })
  }

  detachHonoSession(ctx: HonoContext) {
    deleteCookie(ctx, this.cookieIdKey, {
      domain: this.domain,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
    })

    deleteCookie(ctx, this.cookieExpiresKey, {
      domain: this.domain,
      path: '/',
      sameSite: 'lax',
    })
  }
}

export const sessionService = createLazyInstance(SessionService)
