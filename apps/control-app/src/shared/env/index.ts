import { parseEnv } from '@tooling/env/client'
import { z } from 'zod'

const PublicEnvSchema = z
  .object({
    PUBLIC_STAGE: z.string(),
    PUBLIC_DOMAIN: z.string(),
    PUBLIC_GAMES_APP_URL: z.string(),
    PUBLIC_GAMES_API_URL: z.string(),
    PUBLIC_CONTROL_APP_URL: z.string(),
    PUBLIC_CONTROL_APP_VERSION: z.string(),
    PUBLIC_CONTROL_API_URL: z.string(),
    PUBLIC_AUTH_API_URL: z.string(),
    PUBLIC_ACCESS_API_URL: z.string(),
    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    PUBLIC_VK_APP_ID: z.string(),
  })
  .transform((raw) => ({
    domain: raw.PUBLIC_DOMAIN,
    gamesApp: {
      url: raw.PUBLIC_GAMES_APP_URL,
    },
    gamesApi: {
      url: raw.PUBLIC_GAMES_API_URL,
    },
    controlApp: {
      version: raw.PUBLIC_CONTROL_APP_VERSION,
      url: raw.PUBLIC_CONTROL_APP_URL,
    },
    controlApi: {
      url: raw.PUBLIC_CONTROL_API_URL,
    },
    authApi: {
      url: raw.PUBLIC_AUTH_API_URL,
    },
    accessApi: {
      url: raw.PUBLIC_ACCESS_API_URL,
    },
    telegram: {
      botId: raw.PUBLIC_TELEGRAM_BOT_ID,
    },
    vk: {
      appId: raw.PUBLIC_VK_APP_ID,
    },
  }))

export const env = parseEnv({
  source: window.PUBLIC_ENV,
  schema: PublicEnvSchema,
})
