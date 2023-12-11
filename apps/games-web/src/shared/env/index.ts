import { parseEnv } from '@tooling/env/parse'
import { z } from 'zod'

const EnvSchema = z
  .object({
    PUBLIC_DOMAIN: z.string(),
    PUBLIC_GAMES_WEB_URL: z.string(),
    PUBLIC_GAMES_API_URL: z.string(),
    PUBLIC_GAMES_API_WS_URL: z.string(),
    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    PUBLIC_VK_APP_ID: z.string(),
  })
  .transform((raw) => ({
    domain: raw.PUBLIC_DOMAIN,
    gamesWeb: {
      url: raw.PUBLIC_GAMES_WEB_URL,
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
  source: typeof window !== 'undefined' ? window.ENV : process.env,
  schema: EnvSchema,
})
