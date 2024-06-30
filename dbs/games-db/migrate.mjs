import { dirname, join } from 'path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const psql = postgres(process.env.POSTGRES_URL, { max: 1 })
const db = drizzle(psql)
await migrate(db, { migrationsFolder: join(__dirname, 'drizzle') })
await psql.end()
