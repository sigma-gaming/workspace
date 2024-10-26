import 'reflect-metadata'
import { LoggerOptionsToken } from '@core/logger'
import { DbOptionsToken } from '@dbs/games-db'
import { CacheVersionToken, RedisOptionsToken } from '@games/redis'
import { container } from 'tsyringe-neo'
import { env } from './env'

container.register(LoggerOptionsToken, {
  useValue: { pretty: env.isDev },
})

container.register(DbOptionsToken, {
  useValue: { url: env.gamesDb.url, logger: env.isDev },
})

container.register(RedisOptionsToken, {
  useValue: { host: env.gamesRedis.host, password: env.gamesRedis.password },
})

container.register(CacheVersionToken, {
  useValue: env.gamesApi.version,
})
