import { loadEnv } from '@tooling/env/load'
import express from 'express'
import fs from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import { Writable } from 'node:stream'
import url from 'node:url'
import ReactDOMServer from 'react-dom/server'
import { createServer } from 'vite'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

function root(pathEnd) {
  return path.join(__dirname, '../..', pathEnd)
}

function splitTemplate(template, slots, htmlSlot) {
  const indexedSlots = []

  for (const slot of slots) {
    const index = template.indexOf(slot)
    indexedSlots.push({ index, slot })
  }

  const sortedSlots = indexedSlots
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((indexed) => indexed.slot)

  let current = template
  let htmlFound = false
  const before = []
  const after = []

  for (const slot of sortedSlots) {
    const [left, right] = current.split(slot)

    if (htmlFound) {
      after.push(left, slot)
    } else if (slot === htmlSlot) {
      htmlFound = true
      before.push(left)
    } else {
      before.push(left, slot)
    }

    current = right
  }

  return {
    before: before.filter(Boolean),
    after: after.filter(Boolean),
  }
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

    const htmlSlot = '<!--app-html-->'

    const slots = [
      '<!--app-head-->',
      htmlSlot,
      "'<!--app-env-->'",
      "'<!--app-initial-values-->'",
    ]

    const { before, after } = splitTemplate(template, slots, htmlSlot)

    const { appElement, headHtml, initialValues } = await serverEntry.render({
      url: '/' + url,
      cookies: req.headers.cookie,
    })

    const slotsContent = {
      '<!--app-head-->': headHtml,
      "'<!--app-env-->'": PUBLIC_ENV,
      "'<!--app-initial-values-->'": initialValues,
    }

    res.set({ 'Content-Type': 'text/html' })

    for (const part of before) {
      const isSlot = slots.includes(part)

      if (!isSlot) {
        res.write(part)
        continue
      }

      const content = await slotsContent[part]
      res.write(content)
    }

    const stream = new Writable({
      write(chunk, _encoding, cb) {
        res.write(chunk, cb)
      },
      final: async () => {
        for (const part of after) {
          const isSlot = slots.includes(part)

          if (!isSlot) {
            res.write(part)
            continue
          }

          const content = await slotsContent[part]
          res.write(content)
        }

        res.end()
      },
    })

    ReactDOMServer.renderToPipeableStream(appElement).pipe(stream)
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
