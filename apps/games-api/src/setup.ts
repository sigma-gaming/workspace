import { registerOptions } from '@core/di'
import {
  BovapayOptionsToken,
  GamesCacheOptionsToken,
  GamesDbOptionsToken,
  GamesRedisOptionsToken,
  SessionOptionsToken,
  TelegramBotOptionsToken,
  VkOptionsToken,
} from '@games/options'
import { env } from './env'

registerOptions(GamesDbOptionsToken, {
  url: env.gamesDb.url,
  logger: env.isDev,
})

registerOptions(GamesRedisOptionsToken, {
  host: env.gamesCache.host,
  password: env.gamesCache.password,
})

registerOptions(GamesCacheOptionsToken, {
  version: env.gamesApi.version,
})

registerOptions(SessionOptionsToken, {
  jwt: { secret: env.jwt.secret },
})

registerOptions(BovapayOptionsToken, {
  apiKey: env.bovapay.apiKey,
  apiUrl: env.bovapay.apiUrl,
  callbackUrl: env.bovapay.callbackUrl,
})

registerOptions(TelegramBotOptionsToken, {
  token: env.telegram.botToken,
})

registerOptions(VkOptionsToken, {
  groupToken: env.vk.groupToken,
  serviceToken: env.vk.serviceToken,
})
