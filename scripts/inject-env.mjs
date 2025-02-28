import * as fs from 'fs'

const ENV = Object.entries(process.env).reduce((acc, [key, value]) => {
  if (!key.startsWith('PUBLIC_')) return acc
  acc[key] = value
  return acc
}, {})

const script = `window.PUBLIC_ENV = ${JSON.stringify(ENV)}`

const indexHtmlPath = '/app/index.html'
const content = fs.readFileSync(indexHtmlPath, { encoding: 'utf8' })
const toReplace = '<script type="module" src="/env.js"></script>'
const replaceWith = `<script>${script}</script>`
const withEnv = content.replace(toReplace, replaceWith)
fs.writeFileSync(indexHtmlPath, withEnv)
