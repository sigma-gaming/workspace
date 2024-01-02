import crypto from 'crypto'
import { Prisma } from '@libs/games-db'
import { AccountProvider } from '@libs/games-model'
import { z } from 'zod'
import { SessionService } from '../../../services/session'
import { TelegramBotService } from '../../../services/telegram-bot'
import { prisma } from '../../../shared/db'
import { env } from '../../../shared/env'
import { procedure } from '../../trpc'

const QuerySchema = z.object({
  returnTo: z.string().default(env.gamesApp.url),
  tgAuthResult: z.string(),
})

const TgAuthResultSchema = z.object({
  id: z.number().transform(String),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number().transform(String),
  hash: z.string(),
})

export const telegram = procedure.query(async ({ ctx }) => {
  const { req, res, session } = ctx

  try {
    const query = QuerySchema.parse(req.query)
    const tgAuthResult = TgAuthResultSchema.parse(
      JSON.parse(atob(query.tgAuthResult)),
    )

    const hashToCompareWith = tgAuthResult.hash

    const params = new URLSearchParams(tgAuthResult)

    params.delete('hash')
    params.sort()

    const dataCheckString = [...params.entries()]
      .map((entry) => entry.join('='))
      .join('\n')

    const secret = crypto
      .createHash('sha256')
      .update(`${env.telegram.botId}:${env.telegram.botToken}`)

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

    if (env.isProd && new Date() > validUntil) {
      throw new Error('tgAuthResult is already expired')
    }

    let account = await prisma.account.findFirst({
      where: {
        provider: AccountProvider.Telegram,
        providerUserId: tgAuthResult.id,
      },
      include: { user: true },
    })

    if (session.user && account) {
      if (session.user.id !== account.userId) {
        return res
          .status(400)
          .send('Аккаунт VK уже привязан к другому пользователю')
      }

      res.redirect(query.returnTo)
      return
    }

    const accountSharedInput: Omit<Prisma.AccountCreateInput, 'user'> = {
      provider: AccountProvider.Telegram,
      providerUserId: tgAuthResult.id,
      providerUsername: tgAuthResult.username,
      providerUserFirstName: tgAuthResult.first_name,
      providerUserLastName: tgAuthResult.last_name,
      providerUserImage: tgAuthResult.photo_url,
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

      void TelegramBotService.messageUser(Number(tgAuthResult.id), [
        `Привет, ${tgAuthResult.first_name}!`,
        'Твой Telegram успешно привязан к аккаунту Sigma Games - наслаждайся бонусами =)',
        'Данный бот будет присылать тебе самую важную информацию о проекте:' +
          ' ссылки на новые зеркала сайта, новости об акциях и конкурсах, и многое другое!',
        'Также не забудь подписаться на наш канал в Telegram: @SigmaGamesFeed',
      ])

      res.redirect(query.returnTo)
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
                  usedProvider: AccountProvider.Telegram,
                },
              },
            },
          },
        },
        include: { user: true },
      })
    }

    void TelegramBotService.messageUser(Number(tgAuthResult.id), [
      `Добро пожаловать в Sigma Games, ${tgAuthResult.first_name}!`,
      'Мы автоматически привязали твой Telegram к аккаунту на сайте - наслаждайся бонусами =)',
      'Данный бот будет присылать тебе самую важную информацию о проекте:' +
        ' ссылки на новые зеркала сайта, новости об акциях и конкурсах, и многое другое!',
      'Также не забудь подписаться на наш канал в Telegram: @SigmaGamesFeed',
    ])

    const { cookie } = await SessionService.createSession({
      userId: account.userId,
      provider: AccountProvider.Telegram,
    })

    res.header('Set-Cookie', cookie)
    res.redirect(query.returnTo)
  } catch (error) {
    req.log.error(error)
    console.log(error)

    return res
      .status(400)
      .send('Авторизация не удалась, обратитесь в поддержку')
  }
})
