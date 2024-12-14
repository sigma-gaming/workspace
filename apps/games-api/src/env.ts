import { loadEnv, parseEnv } from '@tooling/env'
import { z } from 'zod'

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PUBLIC_STAGE: z.string(),

    PUBLIC_DOMAIN: z.string(),
    PUBLIC_GAMES_APP_URL: z.string(),
    PUBLIC_GAMES_API_URL: z.string(),
    PUBLIC_GAMES_API_VERSION: z.string().default('unknown'),
    JWT_SECRET: z.string(),

    GAMES_DB_HOST: z.string(),
    GAMES_DB_DATABASE: z.string().default('postgres'),
    GAMES_DB_USER: z.string(),
    GAMES_DB_PASSWORD: z.string(),

    GAMES_CACHE_HOST: z.string(),
    GAMES_CACHE_PASSWORD: z.string(),

    GAMES_NATS_HOST: z.string(),
    GAMES_NATS_USER: z.string(),
    GAMES_NATS_PASSWORD: z.string(),

    BOVAPAY_API_URL: z.string(),
    BOVAPAY_API_KEY: z.string(),
    BOVAPAY_CALLBACK_URL: z.string(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',
    stage: raw.PUBLIC_STAGE,
    domain: raw.PUBLIC_DOMAIN,

    gamesDb: {
      url: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HOST}:5432/${raw.GAMES_DB_DATABASE}`,
    },

    gamesCache: {
      host: raw.GAMES_CACHE_HOST,
      password: raw.GAMES_CACHE_PASSWORD,
    },

    gamesNats: {
      host: raw.GAMES_NATS_HOST,
      user: raw.GAMES_NATS_USER,
      password: raw.GAMES_NATS_PASSWORD,
    },

    gamesApp: {
      url: raw.PUBLIC_GAMES_APP_URL,
    },

    gamesApi: {
      url: raw.PUBLIC_GAMES_API_URL,
      version: raw.PUBLIC_GAMES_API_VERSION,
    },

    jwt: {
      secret: raw.JWT_SECRET,
    },

    bovapay: {
      apiUrl: raw.BOVAPAY_API_URL,
      apiKey: raw.BOVAPAY_API_KEY,
      callbackUrl: raw.BOVAPAY_CALLBACK_URL,
    },
  }))

loadEnv({ root: process.cwd() })

export const env = parseEnv({
  source: process.env,
  schema: EnvSchema,
  exitProcessOnFail: true,
})
