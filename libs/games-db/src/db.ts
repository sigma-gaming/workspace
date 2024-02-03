import * as schema from '@libs/games-db-schema'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

interface Options {
  logger?: boolean
}

export const createDb = (databaseUrl: string, options: Options = {}) => {
  const client = postgres(databaseUrl, { max: 10 })
  return drizzle(client, { schema, logger: options.logger })
}
