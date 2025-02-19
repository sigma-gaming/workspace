import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const PUBLIC_ENV = JSON.stringify(
  Object.entries(process.env).reduce((acc, [key, value]) => {
    if (!key.startsWith('PUBLIC_')) return acc
    acc[key] = value
    return acc
  }, {}),
)

fs.writeFileSync(
  path.join(__dirname, '../public/env.js'),
  `window.PUBLIC_ENV = ${PUBLIC_ENV}`,
)
