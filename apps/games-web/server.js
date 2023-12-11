import { loadEnv } from '@tooling/env/load'
import express from 'express'
import fs from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

function root(pathEnd) {
  return path.join(__dirname, '../..', pathEnd)
}

const paths = {
  dev: {
    serverEntry: './src/entry-server.tsx',
    indexHtml: './index.html',
  },
  prod: {
    serverEntry: './server/entry-server.js',
    indexHtml: './client/index.html',
    static: './client',
  },
}

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

if (isDevelopment) {
  loadEnv({ root: process.cwd() })
}

const PUBLIC_ENV = JSON.stringify(
  Object.entries(process.env).reduce((acc, [key, value]) => {
    if (!key.startsWith('PUBLIC_')) return acc
    acc[key] = value
    return acc
  }, {}),
)

const templateHtml = isProduction
  ? await fs.readFile(paths.prod.indexHtml, 'utf-8')
  : ''

const app = express()

let vite

if (isDevelopment) {
  const { createServer } = await import('vite')

  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  })

  app.use(vite.middlewares)
} else {
  const { default: sirv } = await import('sirv')
  app.use(base, sirv(paths.prod.static, { extensions: [] }))
}

app.get('/health', async (req, res) => {
  res.json({ status: 'healthy' })
})

app.get('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')

    let template
    let serverEntry

    if (isDevelopment) {
      template = await fs.readFile(paths.dev.indexHtml, 'utf-8')
      template = await vite.transformIndexHtml(url, template)
      serverEntry = await vite.ssrLoadModule(paths.dev.serverEntry)
    } else {
      template = templateHtml
      serverEntry = await import(paths.prod.serverEntry)
    }

    const rendered = await serverEntry.render('/' + url, req.headers.cookie)

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? '')
      .replace(`<!--app-html-->`, rendered.html ?? '')
      .replace(`{/* initial-values */}`, rendered.initialValues ?? '')
      .replace(`{/* env */}`, PUBLIC_ENV)

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  } catch (error) {
    vite?.ssrFixStacktrace(error)

    console.log(error.stack)
    res.status(500).end(error.stack)
  }
})

const serverOptions = {}

if (isDevelopment) {
  serverOptions.key = await fs.readFile(root('./ssl/local.key'))
  serverOptions.cert = await fs.readFile(root('./ssl/local.crt'))
}

const server = https.createServer(serverOptions, app)

server.listen(port, () => {
  console.log(`Server started at ${process.env.PUBLIC_GAMES_WEB_URL}`)
})
