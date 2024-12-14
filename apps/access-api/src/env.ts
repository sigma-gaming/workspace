import { loadEnv, parseEnv } from '@tooling/env'
import { z } from 'zod'

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),

    PUBLIC_GAMES_APP_URL: z.string(),
    PUBLIC_CONTROL_APP_URL: z.string(),
    PUBLIC_GAMES_API_VERSION: z.string().default('unknown'),

    PUBLIC_ACCESS_API_URL: z.string(),
    PUBLIC_ACCESS_DOMAIN: z.string(),

    JWT_SECRET: z.string(),

    GAMES_DB_URL: z.string(),
    GAMES_CACHE_HOST: z.string(),
    GAMES_CACHE_PASSWORD: z.string(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',

    gamesDb: {
      url: raw.GAMES_DB_URL,
    },

    gamesCache: {
      host: raw.GAMES_CACHE_HOST,
      password: raw.GAMES_CACHE_PASSWORD,
    },

    gamesApp: {
      url: raw.PUBLIC_GAMES_APP_URL,
    },

    controlApp: {
      url: raw.PUBLIC_CONTROL_APP_URL,
    },

    gamesApi: {
      version: raw.PUBLIC_GAMES_API_VERSION,
    },

    access: {
      apiUrl: raw.PUBLIC_ACCESS_API_URL,
      domain: raw.PUBLIC_ACCESS_DOMAIN,
    },

    jwt: {
      secret: raw.JWT_SECRET,
    },
  }))

loadEnv({ root: process.cwd() })

export const env = parseEnv({
  source: process.env,
  schema: EnvSchema,
  exitProcessOnFail: true,
})
