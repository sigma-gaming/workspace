import {
  collectStream,
  createMemoryLRUCache,
  prepareTemplate,
  streamReact,
} from '@effectify/core/server'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import sirv from 'sirv'

// eslint-disable-next-line @typescript-eslint/naming-convention
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const paths = {
  serverEntry: path.join(__dirname, './server/entry-server.js'),
  indexHtml: path.join(__dirname, './client/index.html'),
  static: path.join(__dirname, './client'),
}

const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

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

const slots = {
  metaHtml: '<!--meta-html-->',
  appHtml: '<!--app-html-->',
  publicEnv: "'<!--public-env-->'",
  initialValues: "'<!--initial-values-->'",
}

const template = fs
  .readFileSync(paths.indexHtml, 'utf-8')
  .replace(slots.publicEnv, PUBLIC_ENV)

const pageCache = createMemoryLRUCache()

const app = express()

app.use(base, sirv(paths.static, { extensions: [] }))

app.get('/health', async (req, res) => {
  res.json({ status: 'healthy' })
})

app.get('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')

    const serverEntry = await import(paths.serverEntry)

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

    if (cache) {
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
        [slots.initialValues]: () => initialValues,
      },
    })

    if (cache) {
      const html = await htmlPromise
      pageCache.set(cache.key, html, cache.ttl)
    }
  } catch (error) {
    const isError = error instanceof Error

    if (isError) {
      console.log(error.stack)
    } else {
      console.error(error)
    }

    res.status(500).end('Internal error')
  }
})

app.listen(port, () => {
  console.log(`Server started at ${process.env.PUBLIC_GAMES_WEB_URL}`)
})
