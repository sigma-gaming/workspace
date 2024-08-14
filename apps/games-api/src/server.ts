import './setup'
import './shared/sentry/init'
import { shutdownServices } from '@core/di'
import { createErrorHandler } from '@core/exceptions'
import { createServer } from '@core/hono-uws'
import { logger, loggerService } from '@core/logger'
import { gamesDb } from '@dbs/games-db'
import { gamesRedis, maintenanceCache } from '@games/redis'
import { env } from '@games/services'
import { sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { app } from './app'
import { initializeCronJobs } from './jobs'
import { sentry } from './shared/sentry'

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

  if (await maintenanceCache.isMaintenanceMode()) {
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

const server = createServer({
  app,
  uwsOptions: env.isDev
    ? {
        key_file_name: '../../ssl/local.key',
        cert_file_name: '../../ssl/local.crt',
      }
    : {},
})

server.listen(5050, (token) => {
  if (!token) {
    logger.error('Failed to start server')
    process.exit(1)
  }

  logger.info(`🚀 Server ready at ${env.gamesApi.url}`)
})

initializeCronJobs()

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

  server.close()
  logger.info('Server closed')

  await sentry?.close(3000)

  logger.info('Cleaning up..')
  await shutdownServices()

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
