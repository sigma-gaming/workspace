import 'reflect-metadata'
import { migrateGamesDB } from '@dbs/games-db'

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL is not set')
}

migrateGamesDB(process.env.POSTGRES_URL).then(() => {
  console.info('Migration finished')
})
