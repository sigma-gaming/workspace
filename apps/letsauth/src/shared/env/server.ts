import { loadEsmEnv, parseEnv } from '@tooling/env'
import { z } from 'zod'

const ServerEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),

    PUBLIC_GAMES_API_VERSION: z.string().default('unknown'),

    PUBLIC_AUTH_API_DOMAIN: z.string(),
    PUBLIC_AUTH_API_URL: z.string(),
    PUBLIC_AUTH_API_VERSION: z.string().default('unknown'),

    JWT_SECRET: z.string(),

    GAMES_DB_URL: z.string(),

    GAMES_CACHE_HOST: z.string(),
    GAMES_CACHE_PASSWORD: z.string(),

    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    TELEGRAM_BOT_TOKEN: z.string(),

    PUBLIC_VK_APP_ID: z.string(),
    VK_SERVICE_TOKEN: z.string(),
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

    gamesApi: {
      version: raw.PUBLIC_GAMES_API_VERSION,
    },

    authApi: {
      domain: raw.PUBLIC_AUTH_API_DOMAIN,
      url: raw.PUBLIC_AUTH_API_URL,
      version: raw.PUBLIC_AUTH_API_VERSION,
    },

    jwt: {
      secret: raw.JWT_SECRET,
    },

    telegram: {
      botId: raw.PUBLIC_TELEGRAM_BOT_ID,
      botToken: raw.TELEGRAM_BOT_TOKEN,
      botFullToken: `${raw.PUBLIC_TELEGRAM_BOT_ID}:${raw.TELEGRAM_BOT_TOKEN}`,
    },

    vk: {
      appId: raw.PUBLIC_VK_APP_ID,
      serviceToken: raw.VK_SERVICE_TOKEN,
    },
  }))

await loadEsmEnv({ root: process.cwd() })

export const serverEnv = parseEnv({
  source: process.env,
  schema: ServerEnvSchema,
  exitProcessOnFail: true,
})
