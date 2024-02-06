import crypto, { randomUUID } from 'crypto'
import {
  AccountInsert,
  AccountProvider,
  Accounts,
  Profiles,
  Users,
} from '@libs/games-db-schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { SessionService } from '../../../services/session'
import { TelegramBotService } from '../../../services/telegram-bot'
import { db } from '../../../shared/db'
import { env } from '../../../shared/env'
import { caches } from '../../../shared/redis'
import { procedure } from '../../trpc'

const TgAuthResultSchema = z.object({
  id: z.number().transform(String),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number().transform(String),
  hash: z.string(),
})

export const telegram = procedure
  .input(
    z.object({
      tgAuthResult: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { req, res, session } = ctx

    try {
      const tgAuthResult = TgAuthResultSchema.parse(
        JSON.parse(atob(input.tgAuthResult)),
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

      let account = await db.query.Accounts.findFirst({
        where: and(
          eq(Accounts.provider, AccountProvider.Telegram),
          eq(Accounts.providerUserId, tgAuthResult.id),
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

      const accountSharedInput: Omit<AccountInsert, 'userId'> = {
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
        await db.insert(Accounts).values({
          userId: session.user.id,
          ...accountSharedInput,
        })

        void TelegramBotService.messageUser(Number(tgAuthResult.id), [
          `Привет, ${tgAuthResult.first_name}!`,
          'Твой Telegram успешно привязан к аккаунту Sigma Games - наслаждайся бонусами =)',
          'Данный бот будет присылать тебе самую важную информацию о проекте:' +
            ' ссылки на новые зеркала сайта, новости об акциях и конкурсах, и многое другое!',
          'Также не забудь подписаться на наш канал: @SigmaGamesFeed',
        ])

        await caches.detailedProfile.del(session.user.id)

        return { status: 'success' }
      }

      /**
       * If user is not logged in and account is not found, perform registration
       */
      if (!account) {
        account = account = await db.transaction(async (tx) => {
          const userId = randomUUID()
          const profileId = randomUUID()

          await tx.insert(Users).values({ id: userId, profileId })

          await tx.insert(Profiles).values({
            id: profileId,
            userId,
            usedProvider: AccountProvider.Telegram,
          })

          const [account] = await tx
            .insert(Accounts)
            .values({ userId, ...accountSharedInput })
            .returning()

          return account
        })

        void TelegramBotService.messageUser(Number(tgAuthResult.id), [
          `Добро пожаловать на Sigma Games, ${tgAuthResult.first_name}!`,
          'Мы автоматически привязали твой Telegram к аккаунту на сайте - наслаждайся бонусами =)',
          'Данный бот будет присылать тебе самую важную информацию о проекте:' +
            ' ссылки на новые зеркала сайта, новости об акциях и конкурсах, и многое другое!',
          'Также не забудь подписаться на наш канал: @SigmaGamesFeed',
        ])
      }

      const { cookie } = await SessionService.createSession({
        userId: account.userId,
        provider: AccountProvider.Telegram,
      })

      res.header('Set-Cookie', cookie)
      return { status: 'success' }
    } catch (error) {
      req.log.error(error)
      return { status: 'failure' }
    }
  })
