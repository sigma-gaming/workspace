import './setup'
import './shared/sentry/init'
import { shutdownAll } from '@core/di'
import { logger } from '@core/logger'
import { gamesRedis } from '@games/services'
import { env } from './env'
import { executeJob, startCronJobs } from './jobs'
import { sentry } from './shared/sentry'

if (env.gamesTasks.mode === 'server') {
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

  await sentry?.close(3000)

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
