import { buildLibrary, emptyDirectory } from '@tooling/build'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = fileURLToPath(new URL('.', import.meta.url))

const distPath = path.resolve(dirname, 'dist')
const src = (file) => path.resolve(dirname, `src/${file}`)

async function build() {
  emptyDirectory(distPath)

  await buildLibrary({
    type: 'multi',
    input: {
      tailwind: src('tailwind.ts'),
    },
    outputDir: distPath,
  })
}

void build()
