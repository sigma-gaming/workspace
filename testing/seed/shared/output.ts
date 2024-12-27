import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export function output(name: string, data: any) {
  const outputDir = join(process.cwd(), 'output')
  mkdirSync(outputDir, { recursive: true })
  writeFileSync(join(outputDir, `${name}.json`), JSON.stringify(data, null, 2))
}
