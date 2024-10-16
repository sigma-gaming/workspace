import { createSingletonProxy } from '@core/di'
import { loadEnv, parseEnv } from '@tooling/env'
import { singleton } from 'tsyringe-neo'
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
    PUBLIC_GAMES_WS_VERSION: z.string().default('unknown'),
    PUBLIC_REFERRAL_REDIRECT_API_URL: z.string(),
    PUBLIC_REFERRAL_REDIRECT_API_VERSION: z.string().default('unknown'),
    GAMES_TASKS_VERSION: z.string().default('unknown'),
    JWT_SECRET: z.string(),

    GAMES_DB_HOST: z.string(),
    GAMES_DB_PORT: z.coerce.number().default(5432),
    GAMES_DB_DATABASE: z.string().default('postgres'),
    GAMES_DB_USER: z.string(),
    GAMES_DB_PASSWORD: z.string(),
    REDIS_HOST: z.string(),
    REDIS_PASSWORD: z.string(),

    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    TELEGRAM_BOT_TOKEN: z.string(),

    PUBLIC_VK_APP_ID: z.string(),
    VK_APP_SECRET: z.string(),
    VK_SERVICE_TOKEN: z.string(),
    VK_GROUP_TOKEN: z.string(),
  })
  .transform((raw) => ({
    isDev: raw.NODE_ENV === 'development',
    isProd: raw.NODE_ENV === 'production',
    stage: raw.PUBLIC_STAGE,
    domain: raw.PUBLIC_DOMAIN,

    postgres: {
      url: `postgresql://${raw.GAMES_DB_USER}:${raw.GAMES_DB_PASSWORD}@${raw.GAMES_DB_HOST}:${raw.GAMES_DB_PORT}/${raw.GAMES_DB_DATABASE}`,
    },

    redis: {
      host: raw.REDIS_HOST,
      password: raw.REDIS_PASSWORD,
    },

    gamesApp: {
      url: raw.PUBLIC_GAMES_APP_URL,
    },

    gamesApi: {
      url: raw.PUBLIC_GAMES_API_URL,
      version: raw.PUBLIC_GAMES_API_VERSION,
    },

    gamesWs: {
      url: raw.PUBLIC_GAMES_WS_URL,
      version: raw.PUBLIC_GAMES_WS_VERSION,
    },

    referralRedirectApi: {
      url: raw.PUBLIC_REFERRAL_REDIRECT_API_URL,
      version: raw.PUBLIC_REFERRAL_REDIRECT_API_VERSION,
    },

    gamesTasks: {
      version: raw.GAMES_TASKS_VERSION,
    },

    controlApp: {
      url: raw.PUBLIC_CONTROL_APP_URL,
    },

    controlApi: {
      url: raw.PUBLIC_CONTROL_API_URL,
      version: raw.PUBLIC_CONTROL_API_VERSION,
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
      groupToken: raw.VK_GROUP_TOKEN,
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
