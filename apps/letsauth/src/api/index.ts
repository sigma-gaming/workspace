import 'reflect-metadata'
import './setup'
import crypto from 'crypto'
import {
  BadRequestException,
  NotAuthenticatedException,
  SessionExpiredException,
} from '@core/exceptions'
import { loggerService } from '@core/logger'
import { createErrorHandler, zValidator } from '@core/server'
import { AccountProvider } from '@dbs/games-types'
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  SessionState,
} from '@games/model'
import { gamesCaches, gamesRedis } from '@games/redis'
import {
  AuthenticatePayload,
  AuthResult,
  authService,
  fraudService,
  sessionService,
} from '@games/services'
import axios from 'axios'
import { parse } from 'cookie'
import { Context, Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { serverEnv } from '../shared/env/server'
import {
  AccessTokenResponse,
  AuthenticateResponse,
  AuthenticateResult,
} from './types'

const VkAuthResultSchema = z.object({
  type: z.literal('silent_token'),
  uuid: z.string(),
  auth: z.union([z.literal(0), z.literal(1)]),
  token: z.string(),
  ttl: z.number(),
  hash: z.string(),
  user: z.object({
    id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    avatar: z.string().optional(),
  }),
})

const VkExchangeSilentAuthTokenSchema = z
  .object({
    response: z.object({
      access_token: z.string(),
      expires_in: z.number(),
      user_id: z.number(),
    }),
  })
  .transform((result) => result.response)

const VkGetProfileSchema = z
  .object({
    response: z.object({
      id: z.number(),
      photo_200: z.string().optional(),
      first_name: z.string(),
      last_name: z.string(),
      screen_name: z.string().optional(),
    }),
  })
  .transform((result) => result.response)

const TgAuthResultSchema = z.object({
  id: z.number().transform(String),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number().transform(String),
  hash: z.string(),
})

function getRefreshToken(ctx: Context): string | null {
  const cookie = ctx.req.header('cookie')
  if (!cookie) return null
  const { refresh_token } = parse(cookie)
  return refresh_token ?? null
}

type SessionVariant =
  | {
      state: SessionState.Authenticated
      payload: RefreshTokenPayload
      sessionExpiresAt: Date
    }
  | { state: SessionState.Expired; payload: null }
  | { state: SessionState.Empty; payload: null }

function getSessionVariant(refreshToken?: string | null): SessionVariant {
  if (!refreshToken) {
    return { state: SessionState.Empty, payload: null }
  }

  try {
    type Verified = RefreshTokenPayload & { exp: number; iat: number }
    const verified = jwt.verify(refreshToken, serverEnv.jwt.secret) as Verified
    const { exp, iat, ...payload } = verified

    return {
      state: SessionState.Authenticated,
      payload,
      sessionExpiresAt: new Date(exp * 1000),
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { state: SessionState.Expired, payload: null }
    }

    return { state: SessionState.Empty, payload: null }
  }
}

export const api = new Hono()
  .basePath('/api')
  .use(
    cors({
      origin: [serverEnv.gamesApp.url, serverEnv.controlApp.url],
      credentials: true,
      allowHeaders: ['content-type', 'sentry-trace', 'baggage'],
    }),
  )
  .get('/accessToken', async (ctx) => {
    const refreshToken = getRefreshToken(ctx)
    const sessionVariant = getSessionVariant(refreshToken)

    if (sessionVariant.state === SessionState.Empty) {
      throw new NotAuthenticatedException()
    }

    if (sessionVariant.state === SessionState.Expired) {
      throw new SessionExpiredException()
    }

    const sessionExpiresAt = sessionVariant.sessionExpiresAt.toISOString()
    const { userId, referrerId, referralCampaignId, provider } =
      sessionVariant.payload

    const payload: AccessTokenPayload = {
      userId,
      referrerId,
      referralCampaignId,
      provider,
    }

    const generateAccessToken = () => {
      const expiresIn = 60 * 15
      return jwt.sign(payload, serverEnv.jwt.secret, { expiresIn })
    }

    let accessToken: string

    if (gamesRedis.status === 'ready' && refreshToken) {
      const cached = await gamesCaches.accessToken.get(refreshToken)

      if (cached) {
        accessToken = cached
      } else {
        accessToken = generateAccessToken()
        await gamesCaches.accessToken.set(refreshToken, accessToken)
      }
    } else {
      accessToken = generateAccessToken()
    }

    return ctx.json<AccessTokenResponse>({ accessToken, sessionExpiresAt })
  })
  .post(
    '/authenticate',
    zValidator(
      'json',
      z.object({
        integration: z.enum(['vk', 'telegram']),
        payload: z.string(),
      }),
    ),
    async (ctx) => {
      const { integration, payload } = ctx.req.valid('json')

      const currentRefreshToken = getRefreshToken(ctx)
      const sessionVariant = getSessionVariant(currentRefreshToken)
      let userId = sessionVariant.payload?.userId
      const referralCampaignCode = getCookie(ctx, 'referralCampaign')

      let authenticatePayload: AuthenticatePayload

      if (integration === 'vk') {
        const authResult = VkAuthResultSchema.parse(JSON.parse(payload))

        const { access_token } = await axios({
          url: 'https://api.vk.com/method/auth.exchangeSilentAuthToken',
          method: 'GET',
          params: {
            v: '5.199',
            token: authResult.token,
            access_token: serverEnv.vk.serviceToken,
            uuid: authResult.uuid,
          },
        }).then((response) => {
          return VkExchangeSilentAuthTokenSchema.parse(response.data)
        })

        const vkProfile = await axios({
          url: 'https://api.vk.com/method/account.getProfileInfo',
          method: 'GET',
          params: {
            v: '5.199',
            access_token,
          },
        }).then((response) => {
          return VkGetProfileSchema.parse(response.data)
        })

        authenticatePayload = {
          userId,
          provider: AccountProvider.VK,
          providerUserId: vkProfile.id.toString(),
          providerUsername: vkProfile.screen_name,
          providerUserFirstName: vkProfile.first_name,
          providerUserLastName: vkProfile.last_name,
          providerUserImage: vkProfile.photo_200,
          referralCampaignCode,
        }
      } else {
        const tgAuthResult = TgAuthResultSchema.parse(JSON.parse(atob(payload)))

        const hashToCompareWith = tgAuthResult.hash

        const params = new URLSearchParams(tgAuthResult)

        params.delete('hash')
        params.sort()

        const dataCheckString = [...params.entries()]
          .map((entry) => entry.join('='))
          .join('\n')

        const secret = crypto
          .createHash('sha256')
          .update(serverEnv.telegram.botFullToken)

        const hash = crypto
          .createHmac('sha256', secret.digest())
          .update(dataCheckString)
          .digest('hex')

        if (hash !== hashToCompareWith) {
          throw new Error('Invalid tgAuthResult')
        }

        const authTimestamp = Number(tgAuthResult.auth_date) * 1000
        const ONE_HOUR = 60 * 60 * 1000
        const validUntil = new Date(authTimestamp + ONE_HOUR)

        if (serverEnv.isProd && new Date() > validUntil) {
          throw new Error('tgAuthResult is already expired')
        }

        authenticatePayload = {
          userId,
          provider: AccountProvider.Telegram,
          providerUserId: tgAuthResult.id,
          providerUsername: tgAuthResult.username,
          providerUserFirstName: tgAuthResult.first_name,
          providerUserLastName: tgAuthResult.last_name,
          providerUserImage: tgAuthResult.photo_url,
          referralCampaignCode,
        }
      }

      const outcome = await authService.authenticate(authenticatePayload)

      if (outcome.result === AuthResult.ConnectedToAnotherUser) {
        throw new BadRequestException({
          message: 'Аккаунт VK уже привязан к другому пользователю',
        })
      }

      if (outcome.result === AuthResult.Connected) {
        return ctx.json<AuthenticateResponse>({
          result: AuthenticateResult.Connected,
        })
      }

      userId = outcome.user.id

      const { refreshToken, expiresAt } = await sessionService.createSession({
        userId,
        referrerId: outcome.user.referrerId,
        referralCampaignId: outcome.user.referralCampaignId,
        provider: AccountProvider.VK,
      })

      const expires = new Date(expiresAt)

      setCookie(ctx, 'refresh_token', refreshToken, {
        domain: serverEnv.authApi.domain,
        path: '/',
        expires,
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      })

      fraudService.actualizeRisk(userId)

      return ctx.json<AuthenticateResponse>({
        result:
          outcome.result === AuthResult.SignedIn
            ? AuthenticateResult.SignedIn
            : AuthenticateResult.SignedUp,
        sessionExpiresAt: expiresAt,
      })
    },
  )
  .post('/logout', async (ctx) => {
    const refreshToken = getRefreshToken(ctx)

    if (!refreshToken) {
      return ctx.json({ status: 'success' })
    }

    const sessionVariant = getSessionVariant(refreshToken)

    deleteCookie(ctx, 'refresh_token', {
      domain: serverEnv.authApi.domain,
      path: '/',
      sameSite: 'none',
      httpOnly: true,
      secure: true,
    })

    if (refreshToken && sessionVariant.state !== SessionState.Empty) {
      await sessionService.removeSession(refreshToken)
    }

    return ctx.json({ status: 'success' })
  })

api.onError(
  createErrorHandler({
    showOriginalError: serverEnv.isDev,
    onInternalError: (error, ctx) => {
      loggerService.forRequest(ctx.req).error(error)
    },
  }),
)

export type ApiType = typeof api
