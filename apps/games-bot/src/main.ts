import './setup'
import { shutdownAll } from '@core/di'
import { logger } from '@core/logger'
import {
  createErrorHandler,
  createServer,
  HonoUwsEnv,
  loggerMiddleware,
  requestIdMiddleware,
} from '@core/server'
import { DomainApp } from '@dbs/games-types-private'
import { affiliateService, domainService } from '@games/services'
import { autoRetry } from '@grammyjs/auto-retry'
import { emoji, EmojiFlavor } from '@grammyjs/emoji'
import {
  fmt,
  hydrateReply,
  link,
  type ParseModeFlavor,
} from '@grammyjs/parse-mode'
import { limit } from '@grammyjs/ratelimiter'
import {
  API_CONSTANTS,
  Bot,
  Context,
  InlineKeyboard,
  webhookCallback,
} from 'grammy'
import { Hono } from 'hono'
import { TemplatedApp } from 'uWebSockets.js'
import { internalApp } from './app/internal'
import { env } from './env'

await domainService.waitForInitialization()

type BotContext = ParseModeFlavor<EmojiFlavor<Context>>

const bot = new Bot<BotContext>(env.telegram.botFullToken)

logger.info('Env')
logger.info(env)

bot.api.config.use(
  autoRetry({
    maxDelaySeconds: 5,
    rethrowHttpErrors: true,
    rethrowInternalServerErrors: true,
    maxRetryAttempts: 30,
  }),
)

bot.use(hydrateReply)
bot.use(limit({ limit: 3, timeFrame: 2000 }))

async function getStartReferralCampaign(match: string) {
  if (!match) return null
  const campaign = await affiliateService.getCampaign(match)
  if (!campaign) return null
  return campaign
}

bot.command('start', async (ctx) => {
  const campaign = await getStartReferralCampaign(ctx.match)

  const latestDomain = domainService.getLatestDomain(DomainApp.GamesApp)

  if (!latestDomain) {
    throw new Error('Actual domain not found')
  }

  const url = new URL(`https://${latestDomain.host}`)

  if (campaign) {
    url.searchParams.set('r', campaign.code)

    affiliateService.incrementCampaignVisits({ campaignId: campaign.id })
  }

  const keyboard = new InlineKeyboard().url('Перейти на сайт', url.toString())

  await ctx.replyFmt(
    fmt([
      fmt`Привет, ${ctx.from?.first_name ?? 'друг'}! ${emoji('video_game')} Добро пожаловать в мир Sigma Games!\n\n`,
      fmt`Наш актуальный домен: ${link(latestDomain.host, url.toString())}. Я добавил кнопку ниже, чтобы ты мог легко перейти на наш сайт и начать своё игровое приключение.\n\n`,
      fmt`У нас ты точно найдешь игру, которая тебе понравится. Присоединяйся к нашему сообществу и начни играть прямо сейчас! ${emoji('smiling_face_with_sunglasses')}\n\n`,
      fmt`Если у тебя возникнут вопросы, я всегда готов помочь. Удачи и приятной игры!`,
    ]),
    { reply_markup: keyboard },
  )
})

let server: TemplatedApp | undefined

if (env.isDev) {
  bot.catch(logger.error)
  bot.start()

  logger.info('🚀 Bot long polling started')
} else {
  const url = env.gamesBot.url

  if (!url) {
    throw new Error('GAMES_BOT_URL is not set')
  }

  if (!env.ports.public) {
    throw new Error('GAMES_BOT_PORT is not set')
  }

  const app = new Hono<HonoUwsEnv>()
    .use(requestIdMiddleware)
    .use(loggerMiddleware)
    .post(
      '/',
      webhookCallback(bot, 'hono', {
        secretToken: env.telegram.webhookSecretToken,
      }),
    )
    .onError(
      createErrorHandler({
        showOriginalError: false,
        onInternalError: (error) => {
          logger.error(error)
        },
      }),
    )

  server = createServer({
    app,
    trustProxy: true,
  })

  server.listen(env.ports.public, (token) => {
    if (!token) {
      logger.error('Failed to start Games Bot')
      process.exit(1)
    }

    logger.info(`🚀 Webhook server started at port ${env.ports.public}`)
    logger.info(`🚀 Bot ready at ${url}`)

    bot.api
      .setWebhook(url, {
        secret_token: env.telegram.webhookSecretToken,
        allowed_updates: API_CONSTANTS.ALL_UPDATE_TYPES,
      })
      .then((is) => {
        logger.info(`Webhook ${is ? 'set' : 'failed to set'}`)
      })
      .catch((error) => {
        logger.info('Failed to set webhook')
        logger.error(error)
      })
  })
}

const internalServer = createServer({
  app: internalApp,
  trustProxy: true,
})

internalServer.listen(env.ports.internal, (token) => {
  if (!token) {
    logger.error('Failed to start Internal API')
    process.exit(1)
  }

  logger.info(`🚀 Internal API ready at :${env.ports.internal}`)
})

process.on('uncaughtException', (error) => {
  logger.info('Uncaught exception')
  logger.error(error)
})

process.on('unhandledRejection', (error) => {
  logger.info('Unhandled rejection')
  logger.error(error)
})

let exited = false

async function handleExit() {
  if (exited) return
  exited = true

  logger.info('Exit signal received')

  if (env.isDev) {
    logger.info('Shutting down services..')
    await shutdownAll()

    logger.info('Exiting..')
    process.exit(0)
  }

  setTimeout(() => {
    logger.info('Timeout, exiting..')
    process.exit(0)
  }, 5000)

  logger.info('Closing servers..')
  internalServer.close()
  logger.info('Servers closed')

  logger.info('Shutting down services..')
  await shutdownAll()

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
