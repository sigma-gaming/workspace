import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildLibrary } from '@tooling/build'

const dirname = fileURLToPath(new URL('.', import.meta.url))

const distPath = path.resolve(dirname, 'dist')

async function build() {
  await buildLibrary({
    type: 'single',
    input: path.resolve(dirname, `server/prod.ts`),
    outputDir: distPath,
    outputBaseName: 'server',
    formats: ['es'],
    declarations: false,
  })
}

void build()
