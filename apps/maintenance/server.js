import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import Client from 'ioredis'
import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const root = (file) => path.join(__dirname, '../../', file)

const distDir = path.join(__dirname, 'dist')
const indexHtml = path.join(distDir, 'index.html')

const PUBLIC_ENV = JSON.stringify(
  Object.entries(process.env).reduce((acc, [key, value]) => {
    if (!key.startsWith('PUBLIC_')) return acc
    acc[key] = value
    return acc
  }, {}),
)

const indexHtmlContent = await fs.readFile(indexHtml, 'utf-8')

await fs.writeFile(
  indexHtml,
  indexHtmlContent.replace(
    '<!-- public-env -->',
    `<script>window.PUBLIC_ENV = ${PUBLIC_ENV}</script>`,
  ),
)

const app = Fastify({
  https:
    process.env.NODE_ENV === 'development'
      ? {
          key: await fs.readFile(root('./ssl/local.key')),
          cert: await fs.readFile(root('./ssl/local.crt')),
        }
      : null,
})

app.register(fastifyStatic, {
  root: distDir,
  wildcard: false,
})

app.setNotFoundHandler((request, reply) => {
  reply.sendFile('index.html')
})

app.get('/health', async () => {
  return { status: 'healthy' }
})

function validate(username, password, req, reply, done) {
  if (username === 'maintenance' && password === 'aoh79a4t38fgs8gf87g28g3f') {
    done()
  } else {
    done(new Error('Not authorized'))
  }
}

app.register(require('@fastify/basic-auth'), { validate })

const redis = new Client(process.env.REDIS_URL)

app.route({
  method: 'GET',
  url: '/get',
  onRequest: app.basicAuth,
  handler: async () => {
    // Redis is required
    if (redis.status !== 'ready') {
      return { value: true }
    }

    const cached = await redis.get('global:maintenance')

    if (cached === null) {
      await redis.set('global:maintenance', 'false')
      return { value: false }
    }

    return { value: JSON.parse(cached) }
  },
})

app.route({
  method: 'POST',
  url: '/set',
  onRequest: app.basicAuth,
  handler: async (request, reply) => {
    if (!request.body) return reply.code(400).send()
    if (typeof request.body !== 'object') return reply.code(400).send()
    const { value } = request.body
    if (typeof value !== 'boolean') return reply.code(400).send()
    await redis.set('global:maintenance', JSON.stringify(value))
    return { value }
  },
})

const port = process.env.PORT || 5173

await app.listen({ host: '0.0.0.0', port }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server listening at ${process.env.PUBLIC_MAINTENANCE_URL}`)
  } else {
    console.log(`Server listening at http://0.0.0.0:${port}`)
  }
})
