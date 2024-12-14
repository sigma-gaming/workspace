import { registerOptions } from '@core/di'
import {
  BovapayOptionsToken,
  GamesCacheOptionsToken,
  GamesDbOptionsToken,
  GamesNatsOptionsToken,
  GamesRedisOptionsToken,
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

registerOptions(GamesNatsOptionsToken, {
  servers: env.gamesNats.host,
  user: env.gamesNats.user,
  pass: env.gamesNats.password,
})

registerOptions(GamesCacheOptionsToken, {
  version: env.gamesApi.version,
})

registerOptions(BovapayOptionsToken, {
  apiKey: env.bovapay.apiKey,
  apiUrl: env.bovapay.apiUrl,
  callbackUrl: env.bovapay.callbackUrl,
})
