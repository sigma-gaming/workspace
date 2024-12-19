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

let internalServer: TemplatedApp | null = null

if (env.gamesTasks.mode === 'server') {
  const internalApp = new Hono<HonoUwsEnv>()
    .route('/healthy', healthyRoute)
    .route('/ready', readyRoute)

  internalServer = createServer({
    app: internalApp,
    trustProxy: true,
  })

  if (!env.ports.internal) {
    throw new Error('Internal port is required in server mode')
  }

  internalServer.listen(env.ports.internal, (token) => {
    if (!token) {
      logger.error('Failed to start Internal API')
      process.exit(1)
    }

    logger.info(`🚀 Internal API ready at :${env.ports.internal}`)
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

  if (internalServer) {
    logger.info('Closing server..')
    internalServer.close()
    logger.info('Server closed')
  }

  await sentry?.close(3000)

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
