import 'reflect-metadata'
import { migrateGamesDB } from '@dbs/games-db'
import { loadEnv, parseEnv } from '@tooling/env'
import { z } from 'zod'

const EnvSchema = z
  .object({
    GAMES_DB_HOST: z.string(),
    GAMES_DB_PORT: z.string().default('5432'),
    GAMES_DB_DATABASE: z.string().default('postgres'),
    GAMES_DB_USER: z.string(),
    GAMES_DB_PASSWORD: z.string(),
  })
  .transform((raw) => {
    console.log(raw)

    return {
      url: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HOST}:${raw.GAMES_DB_PORT}/${raw.GAMES_DB_DATABASE}`,
    }
  })

loadEnv({ root: process.cwd() })

const { url } = parseEnv({
  source: process.env,
  schema: EnvSchema,
  exitProcessOnFail: true,
})

migrateGamesDB(url).then(() => {
  console.info('🚀 Migration finished')
})
