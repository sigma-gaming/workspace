import path from 'path'
import dotenv from 'dotenv'

interface EnvFile {
  path: string
  condition?: () => boolean
}

const createDefaultFiles = (root: string): EnvFile[] => [
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

interface Options {
  root: string
  files?: EnvFile[]
}

export function loadEnv({ root, files = createDefaultFiles(root) }: Options) {
  for (const { path, condition = () => true } of files) {
    if (!condition()) continue
    dotenv.config({ path, override: true })
  }
}
