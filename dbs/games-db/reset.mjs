import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const psql = postgres(process.env.GAMES_DB_URL, { max: 1 })

const db = drizzle(psql)

const query = sql`SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
`

const tables = await db.execute(query)

for (const table of tables) {
  const query = sql.raw(`TRUNCATE TABLE ${table.table_name} CASCADE;`)
  await db.execute(query)
}

await psql.end()
