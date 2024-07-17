import { createSingletonProxy } from '@core/di'
import * as schema from '@dbs/games-schema'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { inject, InjectionToken, singleton } from 'tsyringe-neo'

interface DbOptions {
  url: string
  logger?: boolean
}

export const DbOptionsToken: InjectionToken<DbOptions> = Symbol('DbOptions')

@singleton()
export class DbService {
  db: PostgresJsDatabase<typeof schema>

  constructor(@inject(DbOptionsToken) options: DbOptions) {
    const { url, logger } = options
    const client = postgres(url, { max: 10 })
    this.db = drizzle(client, { schema, logger })
  }
}

export const gamesDb = createSingletonProxy(DbService, (service) => service.db)
