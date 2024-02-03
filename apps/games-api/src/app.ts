import cors from '@fastify/cors'
import ws from '@fastify/websocket'
import { createMaintenanceStorage } from '@libs/maintenance-storage'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import { v4 as uuid } from 'uuid'
import { CronJobs } from './cronjobs'
import { maintenanceEvents } from './events/maintenance'
import { appRouter, createContext } from './routes'
import { BudgetService } from './services/budget'
import { env } from './shared/env'
import { httpLogger, logger } from './shared/logger'

const app = Fastify({
  logger: false,
  genReqId: (req) => {
    const existingID = req.headers['x-trace-id']
    if (existingID) return existingID.toString()
    const id = uuid()
    req.headers['x-trace-id'] = id
    return id
  },
  https: env.isDev
    ? {
        key: fs.readFileSync(path.join(__dirname, '../../../ssl/local.key')),
        cert: fs.readFileSync(path.join(__dirname, '../../../ssl/local.crt')),
      }
    : null,
})

app.addHook('onRequest', (request, reply, done) => {
  httpLogger(request.raw, reply.raw, done)
})

app.addHook('onSend', (request, reply, payloadUnknown, done) => {
  const requestId = request.id
  const payload = typeof payloadUnknown === 'string' ? payloadUnknown : null

  if (reply.statusCode >= 400) {
    logger.error({ requestId, payload })
  } else if (env.isProd && reply.statusCode >= 200) {
    logger.info({ requestId, payload })
  }

  return done()
})

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

const maintenanceStorage = createMaintenanceStorage(env.redis.url)

app.get('/ready', async (_, reply) => {
  if (await maintenanceStorage.isMaintenanceMode()) {
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

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received')

  logger.info('Closing HTTP server..')
  await app.close()
  logger.info('HTTP server closed')

  logger.info('Saving the budget..')
  await BudgetService.syncBudget(true)

  logger.info('Stopping cron jobs..')

  CronJobs.forEach((job) => {
    job.instance.stop()
    logger.info(`Cron job ${job.name} stopped`)
  })

  logger.info('Exiting..')
  process.exit(0)
})
