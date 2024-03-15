import crypto from 'crypto'
import { gamesDb } from '@games/db'
import {
  AccountInsert,
  AccountProvider,
  AccountTable,
  ProfileTable,
  UserTable,
} from '@games/db-schema'
import { gamesCaches } from '@games/redis'
import { env, sessionService, telegramBotService } from '@games/services'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
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

      let account = await gamesDb.query.AccountTable.findFirst({
        where: and(
          eq(AccountTable.provider, AccountProvider.Telegram),
          eq(AccountTable.providerUserId, tgAuthResult.id),
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
        await gamesDb.insert(AccountTable).values({
          userId: session.user.id,
          ...accountSharedInput,
        })

        void telegramBotService.messageUser(Number(tgAuthResult.id), [
          `Привет, ${tgAuthResult.first_name}!`,
          'Твой Telegram успешно привязан к аккаунту Sigma Games - наслаждайся бонусами =)',
          'Данный бот будет присылать тебе самую важную информацию о проекте:' +
            ' ссылки на новые зеркала сайта, новости об акциях и конкурсах, и многое другое!',
          'Также не забудь подписаться на наш канал: @SigmaGamesFeed',
        ])

        await gamesCaches.detailedProfile.del(session.user.id)

        return { status: 'success' }
      }

      /**
       * If user is not logged in and account is not found, perform registration
       */
      if (!account) {
        account = account = await gamesDb.transaction(async (tx) => {
          const [{ id: userId }] = await tx.insert(UserTable).values({}).returning()

          const [{ id: profileId }] = await tx
            .insert(ProfileTable)
            .values({
              userId,
              usedProvider: AccountProvider.Telegram,
            })
            .returning()

          await tx.update(UserTable).set({ profileId }).where(eq(UserTable.id, userId))

          const [account] = await tx
            .insert(AccountTable)
            .values({ userId, ...accountSharedInput })
            .returning()

          return account
        })

        void telegramBotService.messageUser(Number(tgAuthResult.id), [
          `Добро пожаловать на Sigma Games, ${tgAuthResult.first_name}!`,
          'Мы автоматически привязали твой Telegram к аккаунту на сайте - наслаждайся бонусами =)',
          'Данный бот будет присылать тебе самую важную информацию о проекте:' +
            ' ссылки на новые зеркала сайта, новости об акциях и конкурсах, и многое другое!',
          'Также не забудь подписаться на наш канал: @SigmaGamesFeed',
        ])
      }

      const { cookie } = await sessionService.createSession({
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
