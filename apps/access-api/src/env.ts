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

    GAMES_DB_HOST: z.string(),
    GAMES_DB_DATABASE: z.string().default('postgres'),
    GAMES_DB_USER: z.string(),
    GAMES_DB_PASSWORD: z.string(),
    GAMES_REDIS_HOST: z.string(),
    GAMES_REDIS_PASSWORD: z.string(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',

    gamesDb: {
      url: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HOST}:5432/${raw.GAMES_DB_DATABASE}`,
    },

    gamesRedis: {
      host: raw.GAMES_REDIS_HOST,
      password: raw.GAMES_REDIS_PASSWORD,
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
