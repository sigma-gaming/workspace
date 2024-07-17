import './setup'
import { shutdownServices } from '@core/di'
import { createErrorHandler } from '@core/exceptions'
import { logger, loggerService } from '@core/logger'
import { gamesDb } from '@dbs/games-db'
import { gamesRedis } from '@games/redis'
import { env } from '@games/services'
import { TLSServeOptions } from 'bun'
import { sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { app } from './app'

app.get('/healthy', async (ctx) => {
  return ctx.text('Yes')
})

app.get('/ready', async (ctx) => {
  const redisReady = await gamesRedis
    .ping()
    .then(() => true)
    .catch(() => false)

  if (!redisReady) {
    throw new HTTPException(503)
  }

  const postgresReady = await gamesDb
    .execute(sql`SELECT 1`)
    .then(() => true)
    .catch(() => false)

  if (!postgresReady) {
    throw new HTTPException(503)
  }

  return ctx.text('Yes')
})

app.onError(
  createErrorHandler({
    onInternalError: (error, ctx) => {
      loggerService.forRequest(ctx.req).error(error)
    },
  }),
)

// eslint-disable-next-line import/no-anonymous-default-export, import/no-default-export
const config: TLSServeOptions = {
  port: 5051,
  fetch: app.fetch,
}

if (env.isDev) {
  config.development = true
  config.tls = {
    key: Bun.file('../../ssl/local.key'),
    cert: Bun.file('../../ssl/local.crt'),
  }
}

const server = Bun.serve(config)

logger.info(`🚀 Server ready at ${env.controlApi.url}`)

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
    logger.info('Exiting..')
    process.exit(0)
  }

  setTimeout(() => {
    logger.info('Timeout, exiting..')
    process.exit(0)
  }, 5000)

  server.stop()
  logger.info('Server closed')

  logger.info('Cleaning up..')
  await shutdownServices()

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
