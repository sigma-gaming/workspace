import { migrateGamesDB } from '@dbs/games-db'
import cors from '@fastify/cors'
import ws from '@fastify/websocket'
import { maintenanceCache } from '@games/redis'
import { env } from '@games/services'
import { cronJobRegistry } from '@libs/cron-jobs'
import { shutdownServices } from '@libs/di'
import { fastifyLogger, logger } from '@libs/logger'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import { syncBudgetJob } from './cronjobs/budget'
import { maintenanceEvents } from './events/maintenance'
import { appRouter, createContext } from './routes'

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

cronJobRegistry.register('SyncBudget', syncBudgetJob).start()

migrateGamesDB(env.database.url)
  .then(() => app.listen({ host: '0.0.0.0', port: 5050 }))
  .then(() => logger.info(`🚀 Server ready at ${env.gamesApi.url}`))

let exited = false

async function handleExit() {
  if (exited) return
  exited = true

  logger.info('Exit signal received')

  cronJobRegistry.stop()

  await app.close()
  await shutdownServices()

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
