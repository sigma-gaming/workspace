import { migrateGamesDB } from '@dbs/games-db'
import { loadEnv, parseEnv } from '@tooling/env'
import { z } from 'zod'

const EnvSchema = z
  .object({
    GAMES_DB_URL: z.string(),
  })
  .transform((raw) => ({
    url: raw.GAMES_DB_URL,
  }))

loadEnv({ root: process.cwd() })

const { url } = parseEnv({
  source: process.env,
  schema: EnvSchema,
  exitProcessOnFail: true,
})

migrateGamesDB(url).then(() => {
  console.info('🚀 Migration finished')
})
