import { AccountProvider, Prisma } from '@libs/games-db'
import axios from 'axios'
import { z } from 'zod'
import { SessionService } from '../../../services/session'
import { prisma } from '../../../shared/db'
import { env } from '../../../shared/env'
import { procedure } from '../../trpc'

const QuerySchema = z.object({
  payload: z.string(),
})

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
    avatar: z.string(),
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
    }),
  })
  .transform((result) => result.response)

export const vk = procedure.query(async ({ ctx }) => {
  const { req, res, session } = ctx

  try {
    const query = QuerySchema.parse(req.query)
    const payload = PayloadSchema.parse(JSON.parse(query.payload))

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

      res.redirect(env.gamesWeb.url)
      return
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

    const fullName = [vkProfile.first_name, vkProfile.last_name]
      .filter(Boolean)
      .join(' ')

    const accountSharedInput: Omit<Prisma.AccountCreateInput, 'user'> = {
      provider: AccountProvider.VK,
      providerUserId: vkProfile.id.toString(),
      providerUserName: fullName,
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

      res.redirect(env.gamesWeb.url)
      return
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
                  name: fullName,
                  image: vkProfile.photo_200,
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
    res.redirect(env.gamesWeb.url)
  } catch (error) {
    req.log.error(error)

    return res
      .status(400)
      .send('Авторизация не удалась, обратитесь в поддержку')
  }
})
