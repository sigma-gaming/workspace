import { resolveOptions, Shutdownable } from '@core/di'
import { loggerService } from '@core/logger'
import * as schema from '@dbs/games-schema'
import { GamesDbOptionsToken } from '@games/options'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres, { Sql } from 'postgres'

export class GamesDbService extends Shutdownable {
  private readonly logger = loggerService.logger.child('GamesDb')
  client: Sql
  db: PostgresJsDatabase<typeof schema>

  constructor() {
    super()
    const { url, logger, poolSize = 10 } = resolveOptions(GamesDbOptionsToken)
    this.client = postgres(url, { max: poolSize, prepare: false })
    this.db = drizzle(this.client, { schema, logger })
  }

  shutdown() {
    this.logger.info('Shutting down')
    return this.client.end()
  }
}

const service = new GamesDbService()
export const gamesDb = service.db
export const gamesDbClient = service.client
