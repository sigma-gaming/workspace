import 'reflect-metadata'
import { DbOptionsToken } from '@dbs/games-db'
import { CacheVersionToken, RedisOptionsToken } from '@games/redis'
import { env } from '@games/services'
import { LoggerOptionsToken } from '@core/logger'
import { container } from 'tsyringe'

container.register(LoggerOptionsToken, {
  useValue: { pretty: env.isDev },
})

container.register(DbOptionsToken, {
  useValue: { url: env.database.url, logger: env.isDev },
})

container.register(RedisOptionsToken, {
  useValue: { url: env.redis.url },
})

container.register(CacheVersionToken, {
  useValue: env.gamesApi.version,
})
