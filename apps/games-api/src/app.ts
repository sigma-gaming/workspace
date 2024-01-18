import cors from '@fastify/cors'
import ws from '@fastify/websocket'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import { v4 as uuid } from 'uuid'
import { appRouter, createContext } from './routes'
import { env } from './shared/env'
import { colors } from './shared/lib/colors'

const app = Fastify({
  logger: env.isProd,
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

if (env.isDev) {
  app.addHook('onRequest', (req, res, done) => {
    const prefix = colors.cyan(`[Request Incoming - ${req.id}]`)
    console.log(`${prefix} ${req.method} ${req.url}`)
    return done()
  })

  app.addHook('onSend', (req, res, payload, done) => {
    const prefix =
      res.statusCode >= 400
        ? colors.red(`[Request Failed - ${req.id}]`)
        : colors.green(`[Request Completed - ${req.id}]`)

    console.log(`${prefix} ${req.method} ${req.url}`)
    console.log(`Status Code: ${res.statusCode}`)
    console.log(colors.dim(`Payload: ${payload}`))
    return done()
  })
}

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
  return { status: 'healthy' }
})

app.listen({ port: env.port }).then(() => {
  console.log(`🚀 Server ready at ${env.gamesApi.url}`)
})
