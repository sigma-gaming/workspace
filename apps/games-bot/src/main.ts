import './setup'
import { shutdownAll } from '@core/di'
import { logger } from '@core/logger'
import { createServer } from '@core/server'
import { DomainApp } from '@dbs/games-types-private'
import { affiliateService, domainService } from '@games/services'
import { autoRetry } from '@grammyjs/auto-retry'
import {
  fmt,
  hydrateReply,
  link,
  type ParseModeFlavor,
} from '@grammyjs/parse-mode'
import { limit } from '@grammyjs/ratelimiter'
import { apiThrottler } from '@grammyjs/transformer-throttler'
import { Bot, Context, InlineKeyboard, webhookCallback } from 'grammy'
import { TemplatedApp } from 'uWebSockets.js'
import { app } from './app'
import { internalApp } from './app/internal'
import { env } from './env'

type BotContext = ParseModeFlavor<Context>

const bot = new Bot<BotContext>(env.telegram.botFullToken)

const throttler = apiThrottler()
bot.api.config.use(throttler)
bot.api.config.use(autoRetry({ maxDelaySeconds: 5 }))

bot.use(hydrateReply)
bot.use(limit({ limit: 3, timeFrame: 2000 }))

bot.catch(logger.error)

async function processStartQuery(match: string) {
  if (!match) return null
  const campaign = await affiliateService.getCampaign(match)
  if (!campaign) return null
  return campaign.code
}

bot.command('start', async (ctx) => {
  const code = await processStartQuery(ctx.match)

  const latestDomain = domainService.getLatestDomain(DomainApp.GamesApp)

  if (!latestDomain) {
    throw new Error('Actual domain not found')
  }

  const url = `https://${latestDomain.host}?r=${code}`

  const keyboard = new InlineKeyboard().url('Перейти на сайт', url)

  await ctx.replyFmt(
    fmt([
      fmt`Привет, ${ctx.from?.first_name ?? 'друг'}! 🎮 Добро пожаловать в мир Sigma Games!\n\n`,
      fmt`Наш актуальный домен: ${link(latestDomain.host, url)}. Я добавил кнопку ниже, чтобы ты мог легко перейти на наш сайт и начать своё игровое приключение.\n\n`,
      fmt`У нас ты точно найдешь игру, которая тебе понравится. Присоединяйся к нашему сообществу и начни играть прямо сейчас! 😎\n\n`,
      fmt`Если у тебя возникнут вопросы, я всегда готов помочь. Удачи и приятной игры!`,
    ]),
    { reply_markup: keyboard },
  )
})

let server: TemplatedApp | undefined

if (env.isDev) {
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

  app.use(webhookCallback(bot, 'hono'))

  server = createServer({
    app,
    trustProxy: true,
  })

  server.listen(env.ports.public, (token) => {
    if (!token) {
      logger.error('Failed to start API')
      process.exit(1)
    }

    bot.api.setWebhook(url)
    logger.info(`🚀 Bot ready at ${url}`)
  })
}

await domainService.waitForInitialization()

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
  server?.close()
  internalServer.close()
  logger.info('Servers closed')

  logger.info('Shutting down services..')
  await shutdownAll()

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
