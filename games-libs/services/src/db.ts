import { resolveOptions, Shutdownable } from '@core/di'
import { loggerService } from '@core/logger'
import * as schema from '@dbs/games-schema'
import { GamesDbOptionsToken } from '@games/options'
import { sql } from 'drizzle-orm'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres, { Sql } from 'postgres'

export class GamesDbService extends Shutdownable {
  private readonly logger = loggerService.logger.child('GamesDb')

  client: Sql
  db: PostgresJsDatabase<typeof schema>

  private healthClient: Sql | null = null
  private healthDb: PostgresJsDatabase<typeof schema> | null = null

  constructor() {
    super()

    const {
      url,
      healthUrl,
      logger,
      mode = 'transaction',
      poolSize = 10,
    } = resolveOptions(GamesDbOptionsToken)

    this.client = postgres(url, { max: poolSize, prepare: mode === 'session' })
    this.db = drizzle(this.client, { schema, logger })

    if (healthUrl) {
      this.healthClient = postgres(healthUrl, {
        max: 2,
        prepare: mode === 'session',
      })

      this.healthDb = drizzle(this.healthClient, { schema, logger })
    }
  }

  async healthy() {
    const db = this.healthDb ?? this.db

    const healthy = await db
      .execute(sql`SELECT 1`)
      .then(() => true)
      .catch(() => false)

    return healthy
  }

  shutdown() {
    this.logger.info('Shutting down')
    return this.client.end()
  }
}

export const gamesDbService = new GamesDbService()
export const gamesDb = gamesDbService.db
export const gamesDbClient = gamesDbService.client
