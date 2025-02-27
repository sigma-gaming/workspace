import { loadEnv, parseEnv } from '@tooling/env'
import { z } from 'zod'

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PUBLIC_STAGE: z.string(),
    GAMES_WS_PORT: z.coerce.number(),
    GAMES_WS_INTERNAL_PORT: z.coerce.number(),

    PUBLIC_DOMAIN: z.string(),
    PUBLIC_GAMES_APP_URL: z.string(),
    PUBLIC_GAMES_API_VERSION: z.string().default('unknown'),
    PUBLIC_GAMES_WS_URL: z.string(),
    PUBLIC_GAMES_WS_VERSION: z.string().default('unknown'),

    GAMES_DB_HOST: z.string(),
    GAMES_DB_HEALTH_HOST: z.string(),
    GAMES_DB_DATABASE: z.string().default('postgres'),
    GAMES_DB_USER: z.string(),
    GAMES_DB_PASSWORD: z.string(),
    GAMES_CACHE_HOST: z.string(),
    GAMES_CACHE_PASSWORD: z.string(),

    BYPASS_RATE_LIMIT_TOKEN: z.string().optional(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',
    stage: raw.PUBLIC_STAGE,
    domain: raw.PUBLIC_DOMAIN,

    ports: {
      public: raw.GAMES_WS_PORT,
      internal: raw.GAMES_WS_INTERNAL_PORT,
    },

    gamesDb: {
      url: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HOST}:5432/${raw.GAMES_DB_DATABASE}`,
      healthUrl: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HEALTH_HOST}:5432/${raw.GAMES_DB_DATABASE}`,
    },

    gamesCache: {
      host: raw.GAMES_CACHE_HOST,
      password: raw.GAMES_CACHE_PASSWORD,
    },

    gamesApp: {
      url: raw.PUBLIC_GAMES_APP_URL,
    },

    gamesApi: {
      version: raw.PUBLIC_GAMES_API_VERSION,
    },

    gamesWs: {
      url: raw.PUBLIC_GAMES_WS_URL,
      version: raw.PUBLIC_GAMES_WS_VERSION,
    },

    rateLimit: {
      bypassToken: raw.BYPASS_RATE_LIMIT_TOKEN,
    },
  }))

loadEnv({ root: process.cwd() })

export const env = parseEnv({
  source: process.env,
  schema: EnvSchema,
  exitProcessOnFail: true,
})
