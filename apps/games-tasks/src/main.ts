import './setup'
import './shared/sentry/init'
import { shutdownAll } from '@core/di'
import { logger } from '@core/logger'
import { createServer, HonoUwsEnv } from '@core/server'
import { gamesRedis } from '@games/services'
import { Hono } from 'hono'
import { TemplatedApp } from 'uWebSockets.js'
import { env } from './env'
import { executeJob, startCronJobs } from './jobs'
import { healthyRoute, readyRoute } from './routes/health'
import { sentry } from './shared/sentry'

let server: TemplatedApp | null = null

if (env.gamesTasks.mode === 'server') {
  const app = new Hono<HonoUwsEnv>()
    .route('/healthy', healthyRoute)
    .route('/ready', readyRoute)

  server = createServer({
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

  gamesRedis.redis.once('ready', () => {
    startCronJobs()
  })
}

if (env.gamesTasks.mode === 'task') {
  gamesRedis.redis.once('ready', async () => {
    if (!env.gamesTasks.job) {
      logger.error('No job specified')
      process.exit(1)
    }

    await executeJob(env.gamesTasks.job)
    await shutdownAll()
  })
}

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

  if (server) {
    server.close()
    logger.info('Server closed')
  }

  await sentry?.close(3000)

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
