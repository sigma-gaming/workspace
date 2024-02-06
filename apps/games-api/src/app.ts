import cors from '@fastify/cors'
import ws from '@fastify/websocket'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import { CronJobs } from './cronjobs'
import { maintenanceEvents } from './events/maintenance'
import { appRouter, createContext } from './routes'
import { BudgetService } from './services/budget'
import { env } from './shared/env'
import { fastifyLogger, logger } from './shared/logger'
import { shutdownRabbitmq } from './shared/rabbitmq'
import { maintenanceCache, shutdownRedis } from './shared/redis'

const app = Fastify({
  logger: false,
  genReqId: fastifyLogger.genReqId,
  https: env.isDev
    ? {
        key: fs.readFileSync(path.join(__dirname, '../../../ssl/local.key')),
        cert: fs.readFileSync(path.join(__dirname, '../../../ssl/local.crt')),
      }
    : null,
})

fastifyLogger.attach(app)

app.register(ws)

app.register(cors, {
  origin: env.gamesApp.url,
  credentials: true,
})

app.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  useWSS: true,
  trpcOptions: {
    router: appRouter,
    createContext,
  },
})

app.get('/health', async () => {
  return 'Healthy'
})

app.get('/ready', async (_, reply) => {
  if (await maintenanceCache.isMaintenanceMode()) {
    maintenanceEvents.emit('started')
    return reply.status(503).send()
  }

  return 'Ready'
})

CronJobs.forEach((job) => {
  job.instance.start()
  logger.info(`🚀 Cron job ${job.name} started`)
})

app.listen({ host: '0.0.0.0', port: env.port }).then(() => {
  logger.info(`🚀 Server ready at ${env.gamesApi.url}`)
})

let exited = false

async function handleExit() {
  if (exited) return
  exited = true

  logger.info('Exit signal received')

  logger.info('Stopping cron jobs..')

  CronJobs.forEach((job) => {
    job.instance.stop()
    logger.info(`Cron job ${job.name} stopped`)
  })

  logger.info('Saving the budget..')
  await BudgetService.syncBudget(true)

  await Promise.all([app.close(), shutdownRedis(), shutdownRabbitmq()])

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
