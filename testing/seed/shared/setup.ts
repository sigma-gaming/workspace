import { registerOptions } from '@core/di'
import {
  GamesCacheOptionsToken,
  GamesDbOptionsToken,
  GamesRedisOptionsToken,
  SessionOptionsToken,
} from '@games/options'
import { env } from './env'

registerOptions(GamesDbOptionsToken, {
  url: env.gamesDb.url,
  mode: 'transaction',
  poolSize: 50,
  logger: false,
})

registerOptions(GamesRedisOptionsToken, {
  host: env.gamesCache.host,
  password: env.gamesCache.password,
  port: env.gamesCache.port,
})

registerOptions(GamesCacheOptionsToken, {
  version: env.gamesApi.version,
})

registerOptions(SessionOptionsToken, {
  cookie: {
    idKey: 'sessionId',
    expiresKey: 'sessionExpiresAt',
  },
})
