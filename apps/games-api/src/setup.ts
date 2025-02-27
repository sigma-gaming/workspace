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
import { FormatRegistry } from '@sinclair/typebox'
import { env } from './env'

FormatRegistry.Set('uuid', (value) =>
  /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value),
)

registerOptions(GamesDbOptionsToken, {
  url: env.gamesDb.url,
  healthUrl: env.gamesDb.healthUrl,
  poolSize: env.gamesDb.maxPoolSize,
  mode: env.isDev ? 'session' : 'transaction',
  logger: env.isDev,
})

registerOptions(GamesRedisOptionsToken, {
  host: env.gamesCache.host,
  password: env.gamesCache.password,
})

registerOptions(GamesCacheOptionsToken, {
  version: env.gamesApi.version,
})

registerOptions(SessionOptionsToken, {})

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
