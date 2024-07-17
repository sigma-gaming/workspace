import { LoggerOptionsToken } from '@core/logger'
import { DbOptionsToken } from '@dbs/games-db'
import { CacheVersionToken, RedisOptionsToken } from '@games/redis'
import { env } from '@games/services'
import { container } from 'tsyringe-neo'

container.register(LoggerOptionsToken, {
  useValue: { pretty: env.isDev },
})

container.register(DbOptionsToken, {
  useValue: { url: env.postgres.url, logger: env.isDev },
})

container.register(RedisOptionsToken, {
  useValue: { host: env.redis.host, password: env.redis.password },
})

container.register(CacheVersionToken, {
  useValue: env.gamesApi.version,
})
