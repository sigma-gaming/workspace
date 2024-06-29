import './setup'
import { migrateGamesDB } from '@dbs/games-db'
import { maintenanceCache } from '@games/redis'
import { env } from '@games/services'
import { serve } from '@hono/node-server'
import { shutdownServices } from '@libs/di'
import { createErrorHandler } from '@libs/exceptions'
import { logger, loggerService } from '@libs/logger'
import { HTTPException } from 'hono/http-exception'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:https'
import { join } from 'node:path'
import { app } from './app'
import { closeWebSocketServer, injectWebSocket } from './app-base'
import { maintenanceEvents } from './events/maintenance'

app.get('/health', async (ctx) => {
  return ctx.text('Healthy')
})

app.get('/ready', async (ctx) => {
  if (await maintenanceCache.isMaintenanceMode()) {
    maintenanceEvents.emit('started')
    throw new HTTPException(503)
  }

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

  injectWebSocket(server)

  let exited = false

  async function handleExit() {
    if (exited) return
    exited = true

    logger.info('Exit signal received')

    logger.info('Closing WebSocket server..')
    closeWebSocketServer()

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

      logger.info('Cleaning up..')
      await shutdownServices()

      console.info('Exiting..')
      process.exit(0)
    })
  }

  process.on('SIGTERM', handleExit)
  process.on('SIGINT', handleExit)
})
