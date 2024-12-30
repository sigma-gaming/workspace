import './setup'
import './shared/sentry/init'
import { shutdownAll } from '@core/di'
import { logger } from '@core/logger'
import { createErrorHandler } from '@core/server'
import { domainService } from '@games/services'
import { app } from './app'
import { internalApp } from './app/internal'
import { env } from './env'
import { sentry } from './shared/sentry'

app.onError(
  createErrorHandler({
    showOriginalError: env.isDev,
    onInternalError: (error, ctx) => {
      const logger = ctx.get('logger')
      logger.error('Internal error')
      logger.error(error)
    },
  }),
)

const server = Bun.serve({
  port: env.ports.public,
  fetch: app.fetch,
  tls: env.isDev
    ? {
        key: Bun.file('../../ssl/local.key'),
        cert: Bun.file('../../ssl/local.crt'),
      }
    : undefined,
})

const internalServer = Bun.serve({
  port: env.ports.internal,
  fetch: internalApp.fetch,
})

logger.info(`🚀 API ready at ${env.gamesApi.url}`)
logger.info(`🚀 Internal API ready at :${env.ports.internal}`)

// Initialize lazy services
domainService.waitForInitialization()

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
  await server.stop()
  await internalServer.stop()
  logger.info('Servers closed')

  logger.info('Shutting down services..')
  await shutdownAll()

  await sentry?.close(3000)

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
