import express from 'express'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Writable } from 'node:stream'
import url from 'node:url'
import sirv from 'sirv'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const paths = {
  serverEntry: path.join(__dirname, './server/entry-server.js'),
  indexHtml: path.join(__dirname, './client/index.html'),
  static: path.join(__dirname, './client'),
}

const port = process.env.PORT || 5173
const base = process.env.BASE || '/'

const PUBLIC_ENV = JSON.stringify(
  Object.entries(process.env).reduce((acc, [key, value]) => {
    if (!key.startsWith('PUBLIC_')) return acc
    acc[key] = value
    return acc
  }, {}),
)

const templateHtml = await fs.readFile(paths.indexHtml, 'utf-8')

const app = express()

app.use(base, sirv(paths.static, { extensions: [] }))

app.get('/health', async (req, res) => {
  res.json({ status: 'healthy' })
})

app.get('*', async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, '')

    const serverEntry = await import(paths.serverEntry)

    const [beforeHead, afterHead] = templateHtml.split('<!--app-head-->')
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
    console.log(error.stack)
    res.status(500).end('Internal error')
  }
})

app.listen(port, () => {
  console.log(`Server started at ${process.env.PUBLIC_GAMES_WEB_URL}`)
})
