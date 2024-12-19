import './setup'
import { shutdownAll } from '@core/di'
import { logger } from '@core/logger'
import { createErrorHandler, createServer } from '@core/server'
import { domainService } from '@games/services'
import { app } from './app'
import { internalApp } from './app/internal'
import { env } from './env'

app.onError(
  createErrorHandler({
    showOriginalError: env.isDev,
    onInternalError: (error, ctx) => {
      const logger = ctx.get('logger')
      logger.error(error)
    },
  }),
)

const server = createServer({
  app,
  trustProxy: true,
  uwsOptions: env.isDev
    ? {
        key_file_name: '../../ssl/local.key',
        cert_file_name: '../../ssl/local.crt',
      }
    : {},
})

const internalServer = createServer({
  app: internalApp,
  trustProxy: true,
})

server.listen(env.ports.public, (token) => {
  if (!token) {
    logger.error('Failed to start API')
    process.exit(1)
  }

  logger.info(`🚀 API ready at ${env.controlApi.url}`)
})

internalServer.listen(env.ports.internal, (token) => {
  if (!token) {
    logger.error('Failed to start Internal API')
    process.exit(1)
  }

  logger.info(`🚀 Internal API ready at :${env.ports.internal}`)
})

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
  server.close()
  internalServer.close()
  logger.info('Servers closed')

  logger.info('Shutting down services..')
  await shutdownAll()

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
