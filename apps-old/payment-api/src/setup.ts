import { registerOptions } from '@core/di'
import {
  BovapayOptionsToken,
  GamesCacheOptionsToken,
  GamesDbOptionsToken,
  GamesRedisOptionsToken,
} from '@games/options'
import { env } from './env'

registerOptions(GamesDbOptionsToken, {
  url: env.gamesDb.url,
  healthUrl: env.gamesDb.healthUrl,
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

registerOptions(BovapayOptionsToken, {
  apiKey: env.bovapay.apiKey,
  apiUrl: env.bovapay.apiUrl,
  callbackUrl: env.bovapay.callbackUrl,
})
