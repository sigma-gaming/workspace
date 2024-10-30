import { resolveOptions } from '@core/di'
import * as schema from '@dbs/games-schema'
import { GamesDbOptionsToken } from '@games/options'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export class GamesDbService {
  db: PostgresJsDatabase<typeof schema>

  constructor() {
    const { url, logger } = resolveOptions(GamesDbOptionsToken)
    const client = postgres(url, { max: 10 })
    this.db = drizzle(client, { schema, logger })
  }
}

export const gamesDb = new GamesDbService().db
