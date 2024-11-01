import './setup'
import './shared/sentry/init'
import { shutdownAll } from '@core/di'
import { logger } from '@core/logger'
import { createErrorHandler, createServer } from '@core/server'
import { app } from './app'
import { env } from './env'
import { sentry } from './shared/sentry'

app.onError(
  createErrorHandler({
    onInternalError: (error) => {
      logger.child('Request').error(error)
    },
  }),
)

const server = createServer({
  app,
  origin: env.gamesApp.url,
  trustProxy: true,
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

  logger.info('Shutting down services..')
  await shutdownAll()

  if (env.isDev) {
    logger.info('Exiting..')
    process.exit(0)
  }

  setTimeout(() => {
    logger.info('Timeout, exiting..')
    process.exit(0)
  }, 5000)

  logger.info('Closing server..')
  server.close()

  await sentry?.close(3000)

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
