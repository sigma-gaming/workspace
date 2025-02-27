import { loadEnv, parseEnv } from '@tooling/env'
import { z } from 'zod'

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PUBLIC_STAGE: z.string(),
    GAMES_API_PORT: z.coerce.number(),
    GAMES_API_INTERNAL_PORT: z.coerce.number(),

    PUBLIC_DOMAIN: z.string(),
    PUBLIC_GAMES_APP_URL: z.string(),
    PUBLIC_GAMES_API_URL: z.string(),
    PUBLIC_GAMES_API_VERSION: z.string().default('unknown'),
    GAMES_API_GAMES_DB_MAX_POOL_SIZE: z.coerce.number().default(10),

    GAMES_DB_HOST: z.string(),
    GAMES_DB_HEALTH_HOST: z.string(),
    GAMES_DB_DATABASE: z.string().default('postgres'),
    GAMES_DB_USER: z.string(),
    GAMES_DB_PASSWORD: z.string(),

    GAMES_CACHE_HOST: z.string(),
    GAMES_CACHE_PASSWORD: z.string(),

    BYPASS_RATE_LIMIT_TOKEN: z.string().optional(),

    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    TELEGRAM_BOT_TOKEN: z.string(),

    VK_SERVICE_TOKEN: z.string(),
    VK_GROUP_TOKEN: z.string(),

    BOVAPAY_API_URL: z.string(),
    BOVAPAY_API_KEY: z.string(),
    BOVAPAY_CALLBACK_URL: z.string(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',
    stage: raw.PUBLIC_STAGE,
    domain: raw.PUBLIC_DOMAIN,

    ports: {
      public: raw.GAMES_API_PORT,
      internal: raw.GAMES_API_INTERNAL_PORT,
    },

    gamesDb: {
      url: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HOST}:5432/${raw.GAMES_DB_DATABASE}`,
      healthUrl: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HEALTH_HOST}:5432/${raw.GAMES_DB_DATABASE}`,
      maxPoolSize: raw.GAMES_API_GAMES_DB_MAX_POOL_SIZE,
    },

    gamesCache: {
      host: raw.GAMES_CACHE_HOST,
      password: raw.GAMES_CACHE_PASSWORD,
    },

    gamesApp: {
      url: raw.PUBLIC_GAMES_APP_URL,
    },

    gamesApi: {
      url: raw.PUBLIC_GAMES_API_URL,
      version: raw.PUBLIC_GAMES_API_VERSION,
    },

    rateLimit: {
      bypassToken: raw.BYPASS_RATE_LIMIT_TOKEN,
    },

    telegram: {
      botToken: raw.TELEGRAM_BOT_TOKEN,
    },

    vk: {
      serviceToken: raw.VK_SERVICE_TOKEN,
      groupToken: raw.VK_GROUP_TOKEN,
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
