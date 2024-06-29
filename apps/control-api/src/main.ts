import './setup'
import { shutdownServices } from '@core/di'
import { createErrorHandler } from '@core/exceptions'
import { logger, loggerService } from '@core/logger'
import { migrateGamesDB } from '@dbs/games-db'
import { env } from '@games/services'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger as honoLogger } from 'hono/logger'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:https'
import { join } from 'node:path'
import { app } from './app'

app.use(honoLogger())

app.use(
  cors({
    origin: env.controlApp.url,
    credentials: true,
  }),
)

app.get('/health', async (ctx) => {
  return ctx.text('Healthy')
})

app.get('/ready', async (ctx) => {
  return ctx.text('Ready')
})

app.onError(
  createErrorHandler({
    onInternalError: (error, ctx) => {
      loggerService.forRequest(ctx.req).error(error)
    },
  }),
)

migrateGamesDB(env.database.url).then(() => {
  type Options = Parameters<typeof serve>[0]

  const options: Options = {
    fetch: app.fetch,
    port: 5051,
  }

  if (env.isDev) {
    options.createServer = createServer

    options.serverOptions = {
      key: readFileSync(join(__dirname, '../../../ssl/local.key')),
      cert: readFileSync(join(__dirname, '../../../ssl/local.crt')),
    }
  }

  const server = serve(options, () => {
    console.info(`🚀 Server ready at ${env.controlApi.url}`)
  })

  let exited = false

  async function handleExit() {
    if (exited) return
    exited = true

    logger.info('Exit signal received')

    server.close(async () => {
      logger.info('Server closed')

      logger.info('Cleaning up..')
      await shutdownServices()

      console.info('Exiting..')
      process.exit(0)
    })
  }

  process.on('SIGTERM', handleExit)
  process.on('SIGINT', handleExit)
})
