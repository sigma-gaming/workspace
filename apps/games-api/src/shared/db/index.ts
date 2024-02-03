import { createDb } from '@libs/games-db'
import { env } from '../env'

export const db = createDb(env.database.url, {
  logger: env.isDev,
})
