import { InternalServerException } from '@libs/exceptions'
import { Prisma } from '@libs/games-db'
import { AccountProvider } from '@libs/games-model'
import axios from 'axios'
import { z } from 'zod'
import { SessionService } from '../../../services/session'
import { prisma } from '../../../shared/db'
import { env } from '../../../shared/env'
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

      let account = await prisma.account.findFirst({
        where: {
          provider: AccountProvider.VK,
          providerUserId: user_id.toString(),
        },
        include: { user: true },
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

      const accountSharedInput: Omit<Prisma.AccountCreateInput, 'user'> = {
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
        await prisma.account.create({
          data: {
            ...accountSharedInput,
            user: {
              connect: { id: session.user.id },
            },
          },
          include: { user: true },
        })

        return { status: 'success' }
      }

      /**
       * If user is not logged in and account is not found, perform registration
       */
      if (!account) {
        account = await prisma.account.create({
          data: {
            ...accountSharedInput,
            user: {
              create: {
                profile: {
                  create: {
                    usedProvider: AccountProvider.VK,
                  },
                },
              },
            },
          },
          include: { user: true },
        })
      }

      const { cookie } = await SessionService.createSession({
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
