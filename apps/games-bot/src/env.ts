import { loadEnv, parseEnv } from '@tooling/env'
import { z } from 'zod'

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    GAMES_BOT_PORT: z.coerce.number().optional(),
    GAMES_BOT_INTERNAL_PORT: z.coerce.number(),

    PUBLIC_GAMES_API_VERSION: z.string().default('unknown'),

    GAMES_DB_HOST: z.string(),
    GAMES_DB_HEALTH_HOST: z.string(),
    GAMES_DB_DATABASE: z.string().default('postgres'),
    GAMES_DB_USER: z.string(),
    GAMES_DB_PASSWORD: z.string(),
    GAMES_CACHE_HOST: z.string(),
    GAMES_CACHE_PASSWORD: z.string(),

    GAMES_BOT_URL: z.string().optional(),

    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    TELEGRAM_BOT_TOKEN: z.string(),
    TELEGRAM_WEBHOOK_SECRET_TOKEN: z.string().optional(),
    TELEGRAM_WEBHOOK_CERT: z.string().optional(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',

    ports: {
      public: raw.GAMES_BOT_PORT,
      internal: raw.GAMES_BOT_INTERNAL_PORT,
    },

    gamesDb: {
      url: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HOST}:5432/${raw.GAMES_DB_DATABASE}`,
      healthUrl: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HEALTH_HOST}:5432/${raw.GAMES_DB_DATABASE}`,
    },

    gamesCache: {
      host: raw.GAMES_CACHE_HOST,
      password: raw.GAMES_CACHE_PASSWORD,
    },

    gamesApi: {
      version: raw.PUBLIC_GAMES_API_VERSION,
    },

    gamesBot: {
      url: raw.GAMES_BOT_URL,
    },

    telegram: {
      botId: raw.PUBLIC_TELEGRAM_BOT_ID,
      botToken: raw.TELEGRAM_BOT_TOKEN,
      botFullToken: `${raw.PUBLIC_TELEGRAM_BOT_ID}:${raw.TELEGRAM_BOT_TOKEN}`,
      webhookSecretToken: raw.TELEGRAM_WEBHOOK_SECRET_TOKEN,
      webhookCert: raw.TELEGRAM_WEBHOOK_CERT,
    },
  }))

loadEnv({ root: process.cwd() })

export const env = parseEnv({
  source: process.env,
  schema: EnvSchema,
  exitProcessOnFail: true,
})
