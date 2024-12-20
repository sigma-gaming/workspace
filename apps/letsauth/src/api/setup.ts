import { registerOptions } from '@core/di'
import {
  GamesCacheOptionsToken,
  GamesDbOptionsToken,
  GamesRedisOptionsToken,
  SessionOptionsToken,
} from '@games/options'
import { serverEnv } from '../shared/env/server'

registerOptions(GamesDbOptionsToken, {
  url: serverEnv.gamesDb.url,
  logger: serverEnv.isDev,
})

registerOptions(GamesRedisOptionsToken, {
  host: serverEnv.gamesCache.host,
  password: serverEnv.gamesCache.password,
})

registerOptions(GamesCacheOptionsToken, {
  version: serverEnv.gamesApi.version,
})

registerOptions(SessionOptionsToken, {
  jwt: { secret: serverEnv.jwt.secret },
  cookie: {
    idKey: 'sigma_sessionId',
    expiresKey: 'sigma_sessionExpiresAt',
  },
})
