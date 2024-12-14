import { registerOptions } from '@core/di'
import {
  GamesCacheOptionsToken,
  GamesDbOptionsToken,
  GamesNatsOptionsToken,
  GamesRedisOptionsToken,
  SessionOptionsToken,
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

registerOptions(SessionOptionsToken, {
  domain: env.domain,
  jwt: { secret: env.jwt.secret },
})
