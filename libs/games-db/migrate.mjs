import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const psql = postgres(process.env.DATABASE_URL, { max: 1 })
const db = drizzle(psql)
await migrate(db, { migrationsFolder: './drizzle' })
await psql.end()
