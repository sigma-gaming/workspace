import { dirname, join } from 'path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const psql = postgres({
  host: String(process.env.GAMES_DB_HOST),
  port: 5432,
  user: String(process.env.GAMES_DB_USER),
  password: String(process.env.GAMES_DB_PASSWORD),
  database: String(process.env.GAMES_DB_DATABASE),
  max: 1,
})

const db = drizzle(psql)
await migrate(db, { migrationsFolder: join(__dirname, 'drizzle') })
await psql.end()
