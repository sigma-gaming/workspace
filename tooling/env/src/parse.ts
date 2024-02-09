import { Logger } from '@libs/logger'
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
  logger?: Logger
}

export function parseEnv<TOutput, TDef extends ZodTypeDef, TInput>({
  source,
  schema,
  exitProcessOnFail = false,
  logger,
}: Options<TOutput, TDef, TInput>): TOutput {
  try {
    return schema.parse(source)
  } catch (error) {
    if (exitProcessOnFail) {
      logger?.info('Invalid env')
      if (error instanceof ZodError) logger?.error(error.issues)
      else logger?.error(error)
      process.exit(1)
    }

    if (error instanceof ZodError) {
      logger?.info('Invalid env')
      logger?.error(error.issues)
      throw new InvalidEnvError(error)
    }

    throw error
  }
}
