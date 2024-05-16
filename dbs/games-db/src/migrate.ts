import { join } from 'path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const migrationsFolder = join(process.cwd(), '../../dbs/games-db/drizzle')

export async function migrateGamesDB(databaseUrl: string) {
  const psql = postgres(databaseUrl, { max: 1 })
  const db = drizzle(psql)
  console.log({ migrationsFolder })
  await migrate(db, { migrationsFolder })
  await psql.end()
}
