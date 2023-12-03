import { loadEnv } from '@tooling/env/load'
import { parseEnv } from '@tooling/env/parse'
import { z } from 'zod'

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PORT: z.string().transform(Number).default('5050'),

    DOMAIN: z.string(),
    CLIENT_URL: z.string(),
    JWT_SECRET: z.string(),

    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    TELEGRAM_BOT_TOKEN: z.string(),

    PUBLIC_VK_APP_ID: z.string(),
    VK_APP_SECRET: z.string(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',
    port: raw.PORT,
    domain: raw.DOMAIN,
    client: {
      url: raw.CLIENT_URL,
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
    },
  }))

loadEnv({ root: process.cwd() })

export const env = parseEnv({
  source: process.env,
  schema: EnvSchema,
  exitProcessOnFail: true,
})
