import { config } from 'dotenv'
import { expand } from 'dotenv-expand'
import { resolve } from 'node:path'

type EnvFile = {
  path: string
  condition?: () => boolean
}

const createDefaultFiles = (root: string): EnvFile[] => {
  return [
    { path: resolve(root, '.env') },
    {
      path: resolve(root, '.env.development'),
      condition: () => process.env.NODE_ENV === 'development',
    },
    {
      path: resolve(root, '.env.production'),
      condition: () => process.env.NODE_ENV === 'production',
    },
    {
      path: resolve(root, '.env.local'),
      condition: () => process.env.NODE_ENV !== 'production',
    },
  ]
}

type Options = {
  root: string
  files?: EnvFile[]
}

export function loadEnv({ root, files }: Options) {
  files ??= createDefaultFiles(root)

  for (const { path, condition = () => true } of files) {
    if (!condition()) continue

    expand(config({ path, override: true }))
  }
}
