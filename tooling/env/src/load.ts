type EnvFile = {
  path: string
  condition?: () => boolean
}

const createDefaultFiles = (root: string): EnvFile[] => {
  const path = require('path')

  return [
    { path: path.resolve(root, '.env') },
    {
      path: path.resolve(root, '.env.development'),
      condition: () => process.env.NODE_ENV === 'development',
    },
    {
      path: path.resolve(root, '.env.production'),
      condition: () => process.env.NODE_ENV === 'production',
    },
    {
      path: path.resolve(root, '.env.local'),
      condition: () => process.env.NODE_ENV !== 'production',
    },
  ]
}

type Options = {
  root: string
  files?: EnvFile[]
}

export function loadEnv({ root, files = createDefaultFiles(root) }: Options) {
  for (const { path, condition = () => true } of files) {
    if (!condition()) continue
    const dotenv = require('dotenv')
    dotenv.config({ path, override: true })
  }
}
