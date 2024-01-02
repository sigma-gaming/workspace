import { parseEnv } from '@tooling/env/parse'
import { z } from 'zod'

const PublicEnvSchema = z
  .object({
    PUBLIC_DOMAIN: z.string(),
    PUBLIC_GAMES_APP_URL: z.string(),
    PUBLIC_GAMES_API_URL: z.string(),
    PUBLIC_GAMES_API_WS_URL: z.string(),
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
      wsUrl: raw.PUBLIC_GAMES_API_WS_URL,
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
