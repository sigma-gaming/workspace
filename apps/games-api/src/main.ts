import './setup'
import './shared/sentry/init'
import { readFileSync } from 'fs'
import { createServer } from 'https'
import { join } from 'path'
import { shutdownServices } from '@core/di'
import { createErrorHandler } from '@core/exceptions'
import { logger, loggerService } from '@core/logger'
import { gamesDb } from '@dbs/games-db'
import { gamesRedis, maintenanceCache } from '@games/redis'
import { env } from '@games/services'
import { serve } from '@hono/node-server'
import { sql } from 'drizzle-orm'
import { HTTPException } from 'hono/http-exception'
import { app } from './app'
import { maintenanceEvents } from './events/maintenance'
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
    maintenanceEvents.emit('started')
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

type Options = Parameters<typeof serve>[0]

const options: Options = {
  fetch: app.fetch,
  port: 5050,
}

if (env.isDev) {
  options.createServer = createServer

  options.serverOptions = {
    key: readFileSync(join(__dirname, '../../../ssl/local.key')),
    cert: readFileSync(join(__dirname, '../../../ssl/local.crt')),
  }
}

const server = serve(options, () => {
  logger.info(`🚀 Server ready at ${env.gamesApi.url}`)
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

  server.close(async () => {
    logger.info('Server closed')

    await sentry?.close(3000)

    logger.info('Cleaning up..')
    await shutdownServices()

    console.info('Exiting..')
    process.exit(0)
  })
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
