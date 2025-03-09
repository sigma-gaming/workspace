import { loadEnv, parseEnv } from '@tooling/env'
import { z } from 'zod'

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    GAMES_BOT_PORT: z.coerce.number().optional(),
    GAMES_BOT_INTERNAL_PORT: z.coerce.number(),

    DOMAIN_API_URL: z.string(),
    AFFILIATE_API_URL: z.string(),
    GAMES_BOT_URL: z.string().optional(),

    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    TELEGRAM_BOT_TOKEN: z.string(),
    TELEGRAM_WEBHOOK_SECRET_TOKEN: z.string().optional(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',

    ports: {
      public: raw.GAMES_BOT_PORT,
      internal: raw.GAMES_BOT_INTERNAL_PORT,
    },

    domainApi: {
      url: raw.DOMAIN_API_URL,
    },

    affiliateApi: {
      url: raw.AFFILIATE_API_URL,
    },

    gamesBot: {
      url: raw.GAMES_BOT_URL,
    },

    telegram: {
      botToken: raw.TELEGRAM_BOT_TOKEN,
      webhookSecretToken: raw.TELEGRAM_WEBHOOK_SECRET_TOKEN,
    },
  }))

loadEnv({ root: process.cwd() })

export const env = parseEnv({
  source: process.env,
  schema: EnvSchema,
  exitProcessOnFail: true,
})
