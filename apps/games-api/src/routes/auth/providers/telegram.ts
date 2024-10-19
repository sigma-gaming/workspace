import { BadRequestException } from '@core/exceptions'
import { zValidator } from '@core/server'
import { AccountProvider } from '@dbs/games-types'
import {
  AuthResult,
  authService,
  env,
  fraudService,
  sessionService,
  telegramBotService,
} from '@games/services'
import { getCookie } from 'hono/cookie'
import crypto from 'node:crypto'
import { z } from 'zod'
import { createRouter } from '../../../hono'

const TgAuthResultSchema = z.object({
  id: z.number().transform(String),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  auth_date: z.number().transform(String),
  hash: z.string(),
})

export const signInViaTelegramRoute = createRouter().post(
  '/',
  zValidator(
    'json',
    z.object({
      tgAuthResult: z.string(),
    }),
  ),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    const sessionVariant = sessionService.getHonoSessionVariant(ctx)
    const referralCampaignCode = getCookie(ctx, 'referralCampaign')

    const tgAuthResult = TgAuthResultSchema.parse(
      JSON.parse(atob(payload.tgAuthResult)),
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

    const outcome = await authService.authenticate({
      sessionVariant,
      provider: AccountProvider.Telegram,
      providerUserId: tgAuthResult.id,
      providerUsername: tgAuthResult.username,
      providerUserFirstName: tgAuthResult.first_name,
      providerUserLastName: tgAuthResult.last_name,
      providerUserImage: tgAuthResult.photo_url,
      referralCampaignCode,
    })

    if (outcome.result === AuthResult.ConnectedToAnotherUser) {
      throw new BadRequestException({
        message: 'Аккаунт Telegram уже привязан к другому пользователю',
      })
    }

    if (outcome.result === AuthResult.Connected) {
      void telegramBotService.messageUser(Number(tgAuthResult.id), [
        `Привет, ${tgAuthResult.first_name}!`,
        'Твой Telegram успешно привязан к аккаунту Sigma Games - наслаждайся бонусами =)',
        'Данный бот будет присылать тебе самую важную информацию о проекте:' +
          ' ссылки на новые зеркала сайта, новости об акциях и конкурсах, и многое другое!',
        'Также не забудь подписаться на наш канал: @SigmaGamesFeed',
      ])

      return ctx.json({ status: 'success' })
    }

    if (outcome.result === AuthResult.SignedUp) {
      void telegramBotService.messageUser(Number(tgAuthResult.id), [
        `Добро пожаловать на Sigma Games, ${tgAuthResult.first_name}!`,
        'Мы автоматически привязали твой Telegram к аккаунту на сайте - наслаждайся бонусами =)',
        'Данный бот будет присылать тебе самую важную информацию о проекте:' +
          ' ссылки на новые зеркала сайта, новости об акциях и конкурсах, и многое другое!',
        'Также не забудь подписаться на наш канал: @SigmaGamesFeed',
      ])
    }

    const session = await sessionService.createSession({
      userId: outcome.account.userId,
      referrerId: outcome.user.referrerId,
      referralCampaignId: outcome.user.referralCampaignId,
      provider: AccountProvider.Telegram,
    })

    sessionService.attachSession(ctx, session)
    fraudService.actualizeRisk(session.userId, { ctx })

    return ctx.json({ status: 'success' })
  },
)
