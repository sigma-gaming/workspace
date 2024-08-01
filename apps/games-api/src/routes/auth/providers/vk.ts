import { BadRequestException } from '@core/exceptions'
import { gamesDb } from '@dbs/games-db'
import {
  AccountInsert,
  AccountTable,
  ProfileTable,
  UserTable,
} from '@dbs/games-schema'
import { AccountProvider } from '@dbs/games-types'
import { gamesCaches } from '@games/redis'
import { env, sessionService } from '@games/services'
import { zValidator } from '@hono/zod-validator'
import axios from 'axios'
import { and, eq } from 'drizzle-orm'
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

    const { user_id, access_token } = await axios({
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

    let account = await gamesDb.query.AccountTable.findFirst({
      where: and(
        eq(AccountTable.provider, AccountProvider.VK),
        eq(AccountTable.providerUserId, user_id.toString()),
      ),
    })

    if (currentSession.user && account) {
      if (currentSession.user.id !== account.userId) {
        throw new BadRequestException({
          message: 'Аккаунт VK уже привязан к другому пользователю',
        })
      }

      return ctx.json({ status: 'success' })
    }

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

    const accountSharedInput: Omit<AccountInsert, 'userId'> = {
      provider: AccountProvider.VK,
      providerUserId: vkProfile.id.toString(),
      providerUsername: vkProfile.screen_name,
      providerUserFirstName: vkProfile.first_name,
      providerUserLastName: vkProfile.last_name,
      providerUserImage: vkProfile.photo_200,
    }

    /**
     * If user is logged in and account is not found, create account and connect it to user
     */
    if (currentSession.user && !account) {
      await gamesDb.insert(AccountTable).values({
        userId: currentSession.user.id,
        ...accountSharedInput,
      })

      await gamesCaches.detailedProfile.del(currentSession.user.id)

      return ctx.json({ status: 'success' })
    }

    /**
     * If user is not logged in and account is not found, perform registration
     */
    if (!account) {
      account = await gamesDb.transaction(async (tx) => {
        const [{ id: userId }] = await tx
          .insert(UserTable)
          .values({})
          .returning()

        const [{ id: profileId }] = await tx
          .insert(ProfileTable)
          .values({
            userId,
            usedProvider: AccountProvider.VK,
          })
          .returning()

        await tx
          .update(UserTable)
          .set({ profileId })
          .where(eq(UserTable.id, userId))

        const [account] = await tx
          .insert(AccountTable)
          .values({ userId, ...accountSharedInput })
          .returning()

        return account
      })
    }

    const session = await sessionService.createSession({
      userId: account.userId,
      provider: AccountProvider.VK,
    })

    sessionService.attachSession(ctx, session)

    return ctx.json({ status: 'success' })
  },
)
