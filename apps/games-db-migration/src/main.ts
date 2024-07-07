import 'reflect-metadata'
import { migrateGamesDB } from '@dbs/games-db'

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not set')
}

await migrateGamesDB(process.env.POSTGRES_URL)
