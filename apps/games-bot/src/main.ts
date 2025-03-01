import { autoRetry } from '@grammyjs/auto-retry'
import { emoji, EmojiFlavor } from '@grammyjs/emoji'
import {
  fmt,
  hydrateReply,
  link,
  type ParseModeFlavor,
} from '@grammyjs/parse-mode'
import { limit } from '@grammyjs/ratelimiter'
import { serve, ServerType } from '@hono/node-server'
import {
  API_CONSTANTS,
  Bot,
  Context,
  InlineKeyboard,
  webhookCallback,
} from 'grammy'
import { Hono } from 'hono'
import { internalApp } from './app/internal'
import { env } from './env'
import {
  getCampaignsByCodeCode,
  postCampaignsIdIncrementVisits,
} from './shared/api/affiliate'
import { DomainApp, getDomains, getDomainsLatest } from './shared/api/domain'

type BotContext = ParseModeFlavor<EmojiFlavor<Context>>

const bot = new Bot<BotContext>(env.telegram.botToken)

bot.api.config.use(async (prev, method, payload, signal) => {
  try {
    const response = await prev(method, payload, signal)
    return response
  } catch (error) {
    console.error(error)
    throw error
  }
})

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
  const campaign = await getCampaignsByCodeCode(match)
  if (!campaign) return null
  return campaign
}

bot.command('start', async (ctx) => {
  const campaign = await getStartReferralCampaign(ctx.match)

  const latestDomain = await getDomainsLatest({ app: DomainApp.CoreApp })

  if (!latestDomain) {
    throw new Error('Actual domain not found')
  }

  const url = new URL(`https://${latestDomain.host}`)

  if (campaign) {
    url.searchParams.set('r', campaign.code)
    postCampaignsIdIncrementVisits(campaign.id)
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

bot.command('domains', async (ctx) => {
  const domains = await getDomains({ app: DomainApp.CoreApp })

  const keyboard = new InlineKeyboard(
    domains.map((domain) => [
      InlineKeyboard.url(
        `${domain.host} ${emoji('flag_russia')} ${emoji('flag_european_union')}`,
        `https://${domain.host}`,
      ),
    ]),
  )

  await ctx.replyFmt(
    fmt`${emoji('globe_showing_americas')} Доступные домены:`,
    { reply_markup: keyboard },
  )
})

bot.command('help', async (ctx) => {
  await ctx.replyFmt(
    fmt([
      fmt`Доступные команды:\n\n`,
      fmt`${emoji('robot')} /start - Запустить бота\n`,
      fmt`${emoji('globe_showing_americas')} /domains - Показать доступные домены\n`,
      fmt`${emoji('books')} /help - Показать доступные команды\n`,
    ]),
  )
})

let server: ServerType | null = null

if (env.isDev) {
  bot.catch(console.error)
  bot.start()

  console.info('🚀 Bot long polling started')
} else {
  const url = env.gamesBot.url

  if (!url) {
    throw new Error('GAMES_BOT_URL is not set')
  }

  if (!env.ports.public) {
    throw new Error('GAMES_BOT_PORT is not set')
  }

  const app = new Hono().post(
    '/',
    webhookCallback(bot, 'hono', {
      secretToken: env.telegram.webhookSecretToken,
    }),
  )

  server = serve({
    fetch: app.fetch,
    port: env.ports.public,
  })

  server.on('listening', () => {
    console.info(`🚀 Webhook server started at port ${env.ports.public}`)
    console.info(`🚀 Bot ready at ${url}`)

    bot.api
      .setWebhook(url, {
        secret_token: env.telegram.webhookSecretToken,
        allowed_updates: API_CONSTANTS.ALL_UPDATE_TYPES,
      })
      .then((is) => {
        console.info(`Webhook ${is ? 'set' : 'failed to set'}`)
      })
      .catch((error) => {
        console.info('Failed to set webhook')
        console.error(error)
      })
  })
}

bot.api.setMyCommands([
  { command: 'start', description: 'Запустить бота' },
  { command: 'domains', description: 'Показать доступные домены' },
  { command: 'help', description: 'Показать доступные команды' },
])

const internalServer = serve({
  fetch: internalApp.fetch,
  port: env.ports.internal,
})

internalServer.on('listening', () => {
  console.info(`🚀 Internal API ready at :${env.ports.internal}`)
})

process.on('uncaughtException', (error) => {
  console.info('Uncaught exception')
  console.error(error)
})

process.on('unhandledRejection', (error) => {
  console.info('Unhandled rejection')
  console.error(error)
})

let exited = false

async function handleExit() {
  if (exited) return
  exited = true

  console.info('Exit signal received')

  if (env.isDev) {
    console.info('Exiting..')
    process.exit(0)
  }

  setTimeout(() => {
    console.info('Timeout, exiting..')
    process.exit(0)
  }, 5000)

  console.info('Closing servers..')
  internalServer.close()
  console.info('Servers closed')

  console.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
