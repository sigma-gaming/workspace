import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
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

app.get('/maintenance', async (_, reply) => {
  reply.status(503).send()
})

const port = process.env.PORT || 5173

await app.listen({ host: '0.0.0.0', port }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  console.log(`Server listening at ${process.env.PUBLIC_GAMES_APP_URL}`)
})
