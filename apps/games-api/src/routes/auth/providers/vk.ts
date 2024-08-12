import { BadRequestException } from '@core/exceptions'
import { AccountProvider } from '@dbs/games-types'
import { AuthResult, authService, env, sessionService } from '@games/services'
import { zValidator } from '@hono/zod-validator'
import axios from 'axios'
import { Hono } from 'hono'
import { z } from 'zod'

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

export const signInViaVkRoute = new Hono().post(
  '/',
  zValidator(
    'json',
    z.object({
      payload: z.string(),
    }),
  ),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    const currentSession = await sessionService.getHonoSession(ctx)

    const authResult = VkAuthResultSchema.parse(JSON.parse(payload.payload))

    const { access_token } = await axios({
      url: 'https://api.vk.com/method/auth.exchangeSilentAuthToken',
      method: 'GET',
      params: {
        v: '5.199',
        token: authResult.token,
        access_token: env.vk.serviceToken,
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

    const result = await authService.authenticate({
      session: currentSession,
      provider: AccountProvider.VK,
      providerUserId: vkProfile.id.toString(),
      providerUsername: vkProfile.screen_name,
      providerUserFirstName: vkProfile.first_name,
      providerUserLastName: vkProfile.last_name,
      providerUserImage: vkProfile.photo_200,
    })

    if (result.result === AuthResult.ConnectedToAnotherUser) {
      throw new BadRequestException({
        message: 'Аккаунт VK уже привязан к другому пользователю',
      })
    }

    if (result.result === AuthResult.Connected) {
      return ctx.json({ status: 'success' })
    }

    const session = await sessionService.createSession({
      userId: result.account.userId,
      provider: AccountProvider.VK,
    })

    sessionService.attachSession(ctx, session)

    return ctx.json({ status: 'success' })
  },
)
