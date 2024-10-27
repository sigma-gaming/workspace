import crypto from 'crypto'
import { BadRequestException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { AccountProvider } from '@dbs/games-types'
import { gamesCaches } from '@games/redis'
import {
  AuthenticatePayload,
  AuthResult,
  authService,
  fraudService,
  sessionService,
} from '@games/services'
import axios from 'axios'
import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { serverEnv } from '../../shared/env/server'
import { getSessionToken, getSessionVariant } from '../session'
import { AuthenticateResponse, AuthenticateResult } from '../types'

const LATIN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const CODE_ALPHABET = `${LATIN_ALPHABET}${LATIN_ALPHABET.toLowerCase()}0123456789`

function randomChar(alphabet: string) {
  return alphabet[crypto.randomInt(alphabet.length)]
}

function generateCode() {
  return Array.from({ length: 12 }, () => randomChar(CODE_ALPHABET)).join('')
}

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

export const authenticateRoute = new Hono().post(
  '/',
  zValidator(
    'json',
    z.object({
      integration: z.enum(['vk', 'telegram']),
      payload: z.string(),
    }),
  ),
  async (ctx) => {
    const { integration, payload } = ctx.req.valid('json')

    const currentSessionToken = getSessionToken(ctx)
    const sessionVariant = getSessionVariant(currentSessionToken)
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

    const labelMap: Record<typeof integration, string> = {
      vk: 'VK',
      telegram: 'Telegram',
    }

    const label = labelMap[integration]

    const outcome = await authService.authenticate(authenticatePayload)

    if (outcome.result === AuthResult.ConnectedToAnotherUser) {
      throw new BadRequestException({
        message: `Аккаунт ${label} уже привязан к другому пользователю`,
      })
    }

    if (outcome.result === AuthResult.AnotherAccountConnected) {
      throw new BadRequestException({
        message: `Другой аккаунт ${label} уже привязан к вашему профилю`,
      })
    }

    if (outcome.result === AuthResult.Connected) {
      return ctx.json<AuthenticateResponse>({
        result: AuthenticateResult.Connected,
      })
    }

    userId = outcome.user.id

    const { token, expiresAt } = await sessionService.createSession({
      userId,
      referrerId: outcome.user.referrerId,
      referralCampaignId: outcome.user.referralCampaignId,
      provider: AccountProvider.VK,
    })

    const code = generateCode()

    await gamesCaches.sessionCodeToToken.set(code, token)

    const expires = new Date(expiresAt)

    setCookie(ctx, 'session_token', token, {
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
      code,
    })
  },
)
