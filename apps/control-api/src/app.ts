import cors from '@fastify/cors'
import ws from '@fastify/websocket'
import { env } from '@games/services'
import { shutdownServices } from '@libs/di'
import { fastifyLogger, logger } from '@libs/logger'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
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
  origin: env.controlApp.url,
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

app.get('/ready', async () => {
  return 'Ready'
})

app.listen({ host: '0.0.0.0', port: 5051 }).then(() => {
  logger.info(`🚀 Server ready at ${env.controlApi.url}`)
})

let exited = false

async function handleExit() {
  if (exited) return
  exited = true

  logger.info('Exit signal received')

  await app.close()
  await shutdownServices()

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
