import { ZodError, ZodIssue, ZodType, ZodTypeDef } from 'zod'

class InvalidEnvError extends Error {
  issues: ZodIssue[]

  constructor(error: ZodError) {
    super('Invalid ENV Error')
    this.issues = error.issues
  }
}

interface Options<TOutput, TDef extends ZodTypeDef, TInput> {
  source: unknown
  schema: ZodType<TOutput, TDef, TInput>
  exitProcessOnFail?: boolean
}

export function parseEnv<TOutput, TDef extends ZodTypeDef, TInput>({
  source,
  schema,
  exitProcessOnFail = false,
}: Options<TOutput, TDef, TInput>): TOutput {
  try {
    return schema.parse(source)
  } catch (error) {
    if (exitProcessOnFail) {
      console.info('Invalid env')
      if (error instanceof ZodError) console.error(error.issues)
      else console.error(error)
      process.exit(1)
    }

    if (error instanceof ZodError) {
      console.info('Invalid env')
      console.error(error.issues)
      throw new InvalidEnvError(error)
    }

    throw error
  }
}
