import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { buildLibrary, emptyDirectory, buildCLI } from '@tooling/build'

const dirname = fileURLToPath(new URL('.', import.meta.url))

const distPath = path.resolve(dirname, 'dist')
const src = (file) => path.resolve(dirname, `src/${file}`)

async function build() {
  emptyDirectory(distPath)

  await buildLibrary({
    type: 'single',
    input: src('index.ts'),
    outputDir: distPath,
  })

  await buildCLI({
    input: src('cli.ts'),
    output: path.join(distPath, 'bin/copy-env.js'),
  })
}

void build()
