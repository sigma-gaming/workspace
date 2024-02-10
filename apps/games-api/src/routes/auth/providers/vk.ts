import { gamesDb } from '@games/db'
import {
  AccountInsert,
  AccountProvider,
  Accounts,
  Profiles,
  Users,
} from '@games/db-schema'
import { gamesCaches } from '@games/redis'
import { env, sessionService } from '@games/services'
import { InternalServerException } from '@libs/exceptions'
import axios from 'axios'
import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { procedure } from '../../trpc'

const PayloadSchema = z.object({
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

const ExchangeSilentAuthTokenSchema = z
  .object({
    response: z.object({
      access_token: z.string(),
      expires_in: z.number(),
      user_id: z.number(),
    }),
  })
  .transform((result) => result.response)

const GetProfileSchema = z
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

export const vk = procedure
  .input(
    z.object({
      payload: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { req, res, session } = ctx

    try {
      const payload = PayloadSchema.parse(JSON.parse(input.payload))

      const { user_id, access_token } = await axios({
        url: 'https://api.vk.com/method/auth.exchangeSilentAuthToken',
        method: 'GET',
        params: {
          v: '5.199',
          token: payload.token,
          access_token: env.vk.serviceToken,
          uuid: payload.uuid,
        },
      }).then((response) => {
        return ExchangeSilentAuthTokenSchema.parse(response.data)
      })

      let account = await gamesDb.query.Accounts.findFirst({
        where: and(
          eq(Accounts.provider, AccountProvider.VK),
          eq(Accounts.providerUserId, user_id.toString()),
        ),
      })

      if (session.user && account) {
        if (session.user.id !== account.userId) {
          return res
            .status(400)
            .send('Аккаунт VK уже привязан к другому пользователю')
        }

        return { status: 'success' }
      }

      const vkProfile = await axios({
        url: 'https://api.vk.com/method/account.getProfileInfo',
        method: 'GET',
        params: {
          v: '5.199',
          access_token,
        },
      }).then((response) => {
        return GetProfileSchema.parse(response.data)
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
      if (session.user && !account) {
        await gamesDb.insert(Accounts).values({
          userId: session.user.id,
          ...accountSharedInput,
        })

        await gamesCaches.detailedProfile.del(session.user.id)

        return { status: 'success' }
      }

      /**
       * If user is not logged in and account is not found, perform registration
       */
      if (!account) {
        account = await gamesDb.transaction(async (tx) => {
          const userId = randomUUID()
          const profileId = randomUUID()

          await tx.insert(Users).values({ id: userId, profileId })

          await tx.insert(Profiles).values({
            id: profileId,
            userId,
            usedProvider: AccountProvider.VK,
          })

          const [account] = await tx
            .insert(Accounts)
            .values({ userId, ...accountSharedInput })
            .returning()

          return account
        })
      }

      const { cookie } = await sessionService.createSession({
        userId: account.userId,
        provider: AccountProvider.VK,
      })

      res.header('Set-Cookie', cookie)
      return { status: 'success' }
    } catch (error) {
      req.log.error(error)
      throw new InternalServerException()
    }
  })
