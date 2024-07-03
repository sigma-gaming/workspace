import { createSingletonProxy } from '@core/di'
import { loadEnv, parseEnv } from '@tooling/env'
import { singleton } from 'tsyringe'
import { z } from 'zod'

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    PUBLIC_STAGE: z.string(),

    PUBLIC_DOMAIN: z.string(),
    PUBLIC_GAMES_APP_URL: z.string(),
    PUBLIC_GAMES_API_URL: z.string(),
    PUBLIC_GAMES_API_VERSION: z.string().default('unknown'),
    PUBLIC_CONTROL_APP_URL: z.string(),
    PUBLIC_CONTROL_API_URL: z.string(),
    PUBLIC_CONTROL_API_VERSION: z.string().default('unknown'),
    PUBLIC_GAMES_WS_URL: z.string(),
    JWT_SECRET: z.string(),

    POSTGRES_URL: z.string(),
    REDIS_HOST: z.string(),
    REDIS_PASSWORD: z.string(),

    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    TELEGRAM_BOT_TOKEN: z.string(),

    PUBLIC_VK_APP_ID: z.string(),
    VK_APP_SECRET: z.string(),
    VK_SERVICE_TOKEN: z.string(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',
    stage: raw.PUBLIC_STAGE,
    domain: raw.PUBLIC_DOMAIN,

    postgres: {
      url: raw.POSTGRES_URL,
    },

    redis: {
      host: raw.REDIS_HOST,
      password: raw.REDIS_PASSWORD,
    },

    gamesApp: {
      url: raw.PUBLIC_GAMES_APP_URL,
    },

    gamesApi: {
      version: raw.PUBLIC_GAMES_API_VERSION,
      url: raw.PUBLIC_GAMES_API_URL,
    },

    gamesWs: {
      url: raw.PUBLIC_GAMES_WS_URL,
    },

    controlApp: {
      url: raw.PUBLIC_CONTROL_APP_URL,
    },

    controlApi: {
      version: raw.PUBLIC_CONTROL_API_VERSION,
      url: raw.PUBLIC_CONTROL_API_URL,
    },

    jwt: {
      secret: raw.JWT_SECRET,
    },

    telegram: {
      botId: raw.PUBLIC_TELEGRAM_BOT_ID,
      botToken: raw.TELEGRAM_BOT_TOKEN,
      butFullToken: `${raw.PUBLIC_TELEGRAM_BOT_ID}:${raw.TELEGRAM_BOT_TOKEN}`,
    },

    vk: {
      appId: raw.PUBLIC_VK_APP_ID,
      appSecret: raw.VK_APP_SECRET,
      serviceToken: raw.VK_SERVICE_TOKEN,
    },
  }))

export type Env = z.infer<typeof EnvSchema>

@singleton()
export class EnvService {
  env: Env

  constructor() {
    loadEnv({ root: process.cwd() })

    this.env = parseEnv({
      source: process.env,
      schema: EnvSchema,
      exitProcessOnFail: true,
    })
  }
}

export const env = createSingletonProxy(EnvService, (service) => service.env)
