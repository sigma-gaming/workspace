import './setup'
import { shutdownServices } from '@core/di'
import { logger, loggerService } from '@core/logger'
import { createErrorHandler, createServer } from '@core/server'
import { app } from './app'
import { env } from './env'

app.onError(
  createErrorHandler({
    showOriginalError: env.isDev,
    onInternalError: (error, ctx) => {
      loggerService.forRequest(ctx.req).error(error)
    },
  }),
)

const server = createServer({
  app,
  trustProxy: true,
  origin: env.controlApi.url,
  uwsOptions: env.isDev
    ? {
        key_file_name: '../../ssl/local.key',
        cert_file_name: '../../ssl/local.crt',
      }
    : {},
})

server.listen(5051, (token) => {
  if (!token) {
    logger.error('Failed to start server')
    process.exit(1)
  }

  logger.info(`🚀 Server ready at ${env.controlApi.url}`)
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
    logger.info('Exiting..')
    process.exit(0)
  }

  setTimeout(() => {
    logger.info('Timeout, exiting..')
    process.exit(0)
  }, 5000)

  server.close()
  logger.info('Server closed')

  logger.info('Cleaning up..')
  await shutdownServices()

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
