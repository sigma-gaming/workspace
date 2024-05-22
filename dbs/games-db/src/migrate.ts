import { join } from 'path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const migrationsFolder =
  process.env.NODE_ENV === 'development'
    ? join(process.cwd(), '../../dbs/games-db/drizzle')
    : '/app/dbs/games-db/drizzle'

export async function migrateGamesDB(databaseUrl: string) {
  try {
    const psql = postgres(databaseUrl, { max: 1 })
    const db = drizzle(psql)
    await migrate(db, { migrationsFolder })
    await psql.end()
  } catch (error) {
    console.info('[GamesDB] Failed to migrate database')
    console.error(error)
    console.info('[GamesDB] Debug info:')
    console.info({ migrationsFolder })
    process.exit(1)
  }
}
