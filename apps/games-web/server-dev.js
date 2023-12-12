import { loadEnv } from '@tooling/env/load'
import express from 'express'
import fs from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import { Writable } from 'node:stream'
import url from 'node:url'
import { createServer } from 'vite'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

function root(pathEnd) {
  return path.join(__dirname, '../..', pathEnd)
}

const paths = {
  serverEntry: path.join(__dirname, './src/entry-server.tsx'),
  indexHtml: path.join(__dirname, './index.html'),
}

const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

loadEnv({ root: process.cwd() })

const PUBLIC_ENV = JSON.stringify(
  Object.entries(process.env).reduce((acc, [key, value]) => {
    if (!key.startsWith('PUBLIC_')) return acc
    acc[key] = value
    return acc
  }, {}),
)

const app = express()

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  base,
})

app.use(vite.middlewares)

app.get('/health', async (req, res) => {
  res.json({ status: 'healthy' })
})

app.get('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')

    let template = await fs.readFile(paths.indexHtml, 'utf-8')
    template = await vite.transformIndexHtml(url, template)

    const serverEntry = await vite.ssrLoadModule(paths.serverEntry)

    const [beforeHead, afterHead] = template.split('<!--app-head-->')
    const [beforeApp, afterApp] = afterHead.split('<!--app-html-->')
    const [beforeEnv, afterEnv] = afterApp.split(`'<!--app-env-->'`)
    const [beforeInitialValues, afterInitialValues] = afterEnv.split(
      `'<!--app-initial-values-->'`,
    )

    res.set({ 'Content-Type': 'text/html' })
    res.write(beforeHead)
    res.write(beforeApp)

    let initialValues = ''

    const stream = new Writable({
      write(chunk, _encoding, cb) {
        res.write(chunk, cb)
      },
      final() {
        res.write(beforeEnv)
        res.write(PUBLIC_ENV)
        res.write(beforeInitialValues)
        res.write(initialValues)
        res.end(afterInitialValues)
      },
    })

    const rendering = await serverEntry.render({
      stream,
      url: '/' + url,
      cookies: req.headers.cookie,
    })

    initialValues = rendering.initialValues
  } catch (error) {
    vite?.ssrFixStacktrace(error)

    console.log(error.stack)
    res.status(500).end(error.stack)
  }
})

const server = https.createServer(
  {
    key: await fs.readFile(root('./ssl/local.key')),
    cert: await fs.readFile(root('./ssl/local.crt')),
  },
  app,
)

server.listen(port, () => {
  console.log(`Server started at ${process.env.PUBLIC_GAMES_WEB_URL}`)
})
