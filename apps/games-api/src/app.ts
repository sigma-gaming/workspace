import ws from '@fastify/websocket'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import Fastify from 'fastify'
import { v4 as uuid } from 'uuid'
import { appRouter, createContext } from './routes'
import { env } from './shared/env'

const app = Fastify({
  logger: env.isProd,
  genReqId: (req) => {
    const existingID = req.headers['x-trace-id']
    if (existingID) return existingID.toString()
    const id = uuid()
    req.headers['x-trace-id'] = id
    return id
  },
})

if (env.isDev) {
  app.addHook('onRequest', (req, res, done) => {
    console.log(`[Request Incoming - ${req.id}] ${req.method} ${req.url}`)
    return done()
  })

  app.addHook('onSend', (req, res, payload, done) => {
    if (res.statusCode >= 400) {
      console.log(`[Request Failed - ${req.id}] ${req.method} ${req.url}`)
      console.log(`Status Code: ${res.statusCode}, payload: ${payload}`)
      return done()
    }

    console.log(`[Request Completed - ${req.id}] ${req.method} ${req.url}`)
    console.log(`Status Code: ${res.statusCode}, Payload: ${payload}`)
    return done()
  })
}

app.register(ws)

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

app.listen({ host: '0.0.0.0', port: env.port }).then(() => {
  console.log(`🚀 Server ready at http://localhost:${env.port}`)
})
