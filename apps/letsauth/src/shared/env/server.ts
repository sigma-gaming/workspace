import { loadEnv, parseEnv } from '@tooling/env'
import { z } from 'zod'

const ServerEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),

    PUBLIC_AUTH_APP_URL: z.string(),
    PUBLIC_AUTH_API_URL: z.string(),

    GAMES_DB_HOST: z.string(),
    GAMES_DB_HEALTH_HOST: z.string(),
    GAMES_DB_DATABASE: z.string().default('postgres'),
    GAMES_DB_USER: z.string(),
    GAMES_DB_PASSWORD: z.string(),

    GAMES_CACHE_HOST: z.string(),
    GAMES_CACHE_PASSWORD: z.string(),

    PUBLIC_TELEGRAM_BOT_ID: z.string(),

    PUBLIC_VK_APP_ID: z.string(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',

    gamesDb: {
      url: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HOST}:5432/${raw.GAMES_DB_DATABASE}`,
      healthUrl: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HEALTH_HOST}:5432/${raw.GAMES_DB_DATABASE}`,
    },

    gamesCache: {
      host: raw.GAMES_CACHE_HOST,
      password: raw.GAMES_CACHE_PASSWORD,
    },

    authApp: {
      url: raw.PUBLIC_AUTH_APP_URL,
    },

    authApi: {
      url: raw.PUBLIC_AUTH_API_URL,
    },

    telegram: {
      botId: raw.PUBLIC_TELEGRAM_BOT_ID,
    },

    vk: {
      appId: raw.PUBLIC_VK_APP_ID,
    },
  }))

loadEnv({ root: process.cwd() })

export const serverEnv = parseEnv({
  source: process.env,
  schema: ServerEnvSchema,
  exitProcessOnFail: true,
})
