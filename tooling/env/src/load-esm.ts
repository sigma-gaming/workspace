type EnvFile = {
  path: string
  condition?: () => boolean
}

const createDefaultFiles = async (root: string): Promise<EnvFile[]> => {
  const path = await import('node:path')

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

export async function loadEsmEnv({ root, files }: Options) {
  files ??= await createDefaultFiles(root)

  for (const { path, condition = () => true } of files) {
    if (!condition()) continue
    const dotenv = await import('dotenv')
    dotenv.config({ path, override: true })
  }
}
