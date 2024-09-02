import './setup'
import './shared/sentry/init'
import { shutdownServices } from '@core/di'
import { logger, loggerService } from '@core/logger'
import { createErrorHandler, createServer } from '@core/server'
import { env } from '@games/services'
import { createRouter } from './hono'
import { initializeCronJobs } from './jobs'
import { healthyRoute, readyRoute } from './routes/health'
import { sentry } from './shared/sentry'

const app = createRouter()
  .route('/healthy', healthyRoute)
  .route('/ready', readyRoute)

app.onError(
  createErrorHandler({
    onInternalError: (error, ctx) => {
      loggerService.forRequest(ctx.req).error(error)
    },
  }),
)

const server = createServer({
  app,
  trustProxy: true,
})

const port = 5053

server.listen(port, (token) => {
  if (!token) {
    logger.error('Failed to start server')
    process.exit(1)
  }

  logger.info(`🚀 Server ready at :${port}`)
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
