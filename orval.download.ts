import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { Source } from './orval.sources'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

if (!existsSync('./openapi')) {
  mkdirSync('./openapi')
}

export async function downloadOpenApi(source: Source) {
  try {
    const response = await fetch(source.url)

    if (!response.ok) {
      console.info(`Skipping ${source.file} because of ${response.status}`)
      return
    }

    const json = await response.json()

    const local = existsSync(source.file)
      ? readFileSync(source.file, 'utf-8')
      : null

    const remote = JSON.stringify(json, null, 2)

    if (remote === local) return
    writeFileSync(source.file, remote)
  } catch (error) {
    // console.info(`Skipping ${source.file} because of error`)
    // console.error(error)
  }
}
