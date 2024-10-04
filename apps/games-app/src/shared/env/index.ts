import { parseEnv } from '@tooling/env'
import { z } from 'zod'

const PublicEnvSchema = z
  .object({
    PUBLIC_STAGE: z.string(),
    PUBLIC_DOMAIN: z.string(),
    PUBLIC_GAMES_APP_URL: z.string(),
    PUBLIC_GAMES_APP_VERSION: z.string(),
    PUBLIC_GAMES_API_URL: z.string(),
    PUBLIC_GAMES_WS_URL: z.string(),
    PUBLIC_REFERRAL_REDIRECT_API_URL: z.string(),
    PUBLIC_TELEGRAM_BOT_ID: z.string(),
    PUBLIC_VK_APP_ID: z.string(),
  })
  .transform((raw) => ({
    stage: raw.PUBLIC_STAGE,
    domain: raw.PUBLIC_DOMAIN,
    gamesApp: {
      version: raw.PUBLIC_GAMES_APP_VERSION,
      url: raw.PUBLIC_GAMES_APP_URL,
    },
    gamesApi: {
      url: raw.PUBLIC_GAMES_API_URL,
    },
    gamesWs: {
      url: raw.PUBLIC_GAMES_WS_URL,
    },
    referralRedirectApi: {
      url: raw.PUBLIC_REFERRAL_REDIRECT_API_URL,
    },
    telegram: {
      botId: raw.PUBLIC_TELEGRAM_BOT_ID,
    },
    vk: {
      appId: raw.PUBLIC_VK_APP_ID,
    },
  }))

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line import-x/no-unresolved
  await import('/env.js?url')
}

export const env = parseEnv({
  source: window.PUBLIC_ENV,
  schema: PublicEnvSchema,
})
