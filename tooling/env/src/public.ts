import { z, ZodError } from 'zod'

class InvalidEnvSourceError extends Error {
  constructor(source: unknown) {
    super(
      `Invalid ENV Source Error, expected Record<string, string>, got: ${typeof source}`,
    )
  }
}

const EnvRecordSchema = z.record(z.string())

type Options = {
  source: unknown
  exitProcessOnFail?: boolean
}

export function getPublicEnv({
  source,
  exitProcessOnFail = false,
}: Options): Record<string, string> {
  try {
    const result: Record<string, string> = {}
    const object = EnvRecordSchema.parse(source)

    for (const key in object) {
      if (!key.startsWith('PUBLIC_')) continue
      result[key] = object[key]
    }

    return result
  } catch (error) {
    if (exitProcessOnFail) {
      console.info('Invalid env source')
      if (error instanceof ZodError) console.error(error.issues)
      else console.error(error)
      process.exit(1)
    }

    if (error instanceof ZodError) {
      console.info('Invalid env source')
      console.error(error.issues)
      throw new InvalidEnvSourceError(source)
    }

    throw error
  }
}
