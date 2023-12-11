import { loadEnv } from '@tooling/env/load'
import { parseEnv } from '@tooling/env/parse'
import { z } from 'zod'

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.string().transform(Number).default('5050'),

    PUBLIC_DOMAIN: z.string(),
    PUBLIC_GAMES_WEB_URL: z.string(),
    PUBLIC_GAMES_API_URL: z.string(),
    PUBLIC_GAMES_API_WS_URL: z.string(),
    JWT_SECRET: z.string(),

    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    TELEGRAM_BOT_TOKEN: z.string(),

    PUBLIC_VK_APP_ID: z.string(),
    VK_APP_SECRET: z.string(),
    VK_SERVICE_TOKEN: z.string(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',
    port: raw.PORT,
    domain: raw.PUBLIC_DOMAIN,
    gamesWeb: {
      url: raw.PUBLIC_GAMES_WEB_URL,
      wsUrl: raw.PUBLIC_GAMES_API_WS_URL,
    },
    gamesApi: {
      url: raw.PUBLIC_GAMES_API_URL,
    },
    jwt: {
      secret: raw.JWT_SECRET,
    },
    telegram: {
      botId: raw.PUBLIC_TELEGRAM_BOT_ID,
      botToken: raw.TELEGRAM_BOT_TOKEN,
    },
    vk: {
      appId: raw.PUBLIC_VK_APP_ID,
      appSecret: raw.VK_APP_SECRET,
      serviceToken: raw.VK_SERVICE_TOKEN,
    },
  }))

loadEnv({ root: process.cwd() })

export const env = parseEnv({
  source: process.env,
  schema: EnvSchema,
  exitProcessOnFail: true,
})
