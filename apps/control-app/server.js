import fastifyStatic from '@fastify/static'
import { getPublicEnv } from '@tooling/env'
import Fastify from 'fastify'
import fs from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const root = (file) => path.join(__dirname, '../../', file)

const distDir = path.join(__dirname, 'dist')
const indexHtml = path.join(distDir, 'index.html')

const PUBLIC_ENV = JSON.stringify(
  getPublicEnv({ source: process.env, exitProcessOnFail: true }),
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
  allowedPath: (path) => path !== '/',
})

app.setNotFoundHandler((_, reply) => {
  reply.header('Cache-Control', 'no-cache, no-store').sendFile('index.html')
})

app.get('/health', async (_, reply) => {
  const response = await fetch('http://control-api:5051/health')
  if (response.ok) return 'Healthy'
  return reply.status(response.status).send()
})

app.get('/ready', async (_, reply) => {
  const response = await fetch('http://control-api:5051/ready')
  if (response.ok) return 'Ready'
  return reply.status(response.status).send()
})

const port = 5174

await app.listen({ host: '0.0.0.0', port }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  console.log(`Server listening at ${process.env.PUBLIC_CONTROL_APP_URL}`)
})
