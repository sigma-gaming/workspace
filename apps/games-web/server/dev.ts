import {
  collectStream,
  createMemoryLRUCache,
  prepareTemplate,
  streamReact,
} from '@effectify/core/server'
import { loadEnv } from '@tooling/env/load'
import express from 'express'
import fs from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import { createServer } from 'vite'

const USE_CACHE = process.env.USE_CACHE === 'true'

function root(pathEnd: string) {
  return path.join(process.cwd(), '../..', pathEnd)
}

const paths = {
  serverEntry: path.join(process.cwd(), './src/entry-server.tsx'),
  indexHtml: path.join(process.cwd(), './index.html'),
}

const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

loadEnv({ root: process.cwd() })

const PUBLIC_ENV = JSON.stringify(
  Object.entries(process.env).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (!key.startsWith('PUBLIC_')) return acc
      acc[key] = value
      return acc
    },
    {},
  ),
)

const app = express()

const vite = await createServer({
  server: {
    middlewareMode: true,
  },
  appType: 'custom',
  base,
})

app.use(vite.middlewares)

app.get('/health', async (req, res) => {
  res.json({ status: 'healthy' })
})

const slots = {
  metaHtml: '<!--meta-html-->',
  appHtml: '<!--app-html-->',
  publicEnv: "'<!--public-env-->'",
  initialValues: "'<!--initial-values-->'",
}

const pageCache = createMemoryLRUCache()

app.get('*', async (req, res) => {
  try {
    console.info('Rendering', req.originalUrl)
    const url = req.originalUrl.replace(base, '')

    let template = await fs.readFile(paths.indexHtml, 'utf-8')
    template = await vite.transformIndexHtml(url, template)

    const serverEntry = await vite.ssrLoadModule(paths.serverEntry)

    const templateParts = prepareTemplate({
      template,
      slots: Object.values(slots),
      htmlSlot: slots.appHtml,
    })

    res.set({ 'Content-Type': 'text/html' })
    if (templateParts.start) res.write(templateParts.start)

    /**
     * Collect after the start part of the template has been written
     * to cache only the dynamic part that starts on the first slot
     */
    const htmlPromise = collectStream(res)

    const { page, scope, cache } = await serverEntry.init({
      url,
      req,
      res,
    })

    if (USE_CACHE && cache) {
      const cached = pageCache.get(cache.key)

      if (cached) {
        res.end(cached)
        return
      }
    }

    const { appElement, metaHtml, initialValues } = await serverEntry.render({
      page,
      scope,
    })

    await streamReact({
      appElement,
      writable: res,
      templateParts,
      content: {
        [slots.metaHtml]: () => metaHtml,
        [slots.publicEnv]: () => PUBLIC_ENV,
        [slots.initialValues]: () => initialValues,
      },
    })

    if (USE_CACHE && cache) {
      const html = await htmlPromise
      pageCache.set(cache.key, html, cache.ttl)
    }
  } catch (error) {
    const isError = error instanceof Error

    if (!isError) {
      res.status(500).end(error)
      return
    }

    vite.ssrFixStacktrace(error)

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
