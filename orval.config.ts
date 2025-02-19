import { existsSync } from 'fs'
import { defineConfig, Options } from 'orval'
import { Source, sources } from './orval.sources'

function createApi(target: string, source: Source): Options {
  return {
    input: {
      target: source.file,
    },
    output: {
      mode: 'tags-split',
      workspace: target,
      target: '.',
      client: 'fetch',
      schemas: './types',
      clean: true,
      mock: false,

      override: {
        mutator: {
          path: '../request.ts',
          name: 'request',
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
        useTypeOverInterfaces: true,
      },
    },
  }
}

for (const source of Object.values(sources)) {
  if (!existsSync(source.file)) {
    console.warn(`No ${source.file} found, run watch script to download it`)
  }
}

const config = Object.entries(sources).reduce(
  (acc, [name, source]) => {
    let index = 0

    for (const target of source.targets) {
      acc[name + '-' + index++] = createApi(target, source)
    }

    return acc
  },
  {} as Record<string, Options>,
)

// eslint-disable-next-line import-x/no-default-export
export default defineConfig(config)
