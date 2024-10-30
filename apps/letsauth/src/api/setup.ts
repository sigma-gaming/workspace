import 'reflect-metadata'
import { LoggerOptionsToken } from '@core/logger'
import { DbOptionsToken } from '@dbs/games-db'
import { CacheVersionToken, RedisOptionsToken } from '@games/redis'
import { SessionOptionsToken } from '@games/services'
import { container } from 'tsyringe-neo'
import { serverEnv } from '../shared/env/server'

container.register(LoggerOptionsToken, {
  useValue: { pretty: serverEnv.isDev },
})

container.register(DbOptionsToken, {
  useValue: { url: serverEnv.gamesDb.url, logger: serverEnv.isDev },
})

container.register(RedisOptionsToken, {
  useValue: {
    host: serverEnv.gamesRedis.host,
    password: serverEnv.gamesRedis.password,
  },
})

container.register(CacheVersionToken, {
  useValue: serverEnv.gamesApi.version,
})

container.register(SessionOptionsToken, {
  useValue: {
    domain: serverEnv.authApi.domain,
    jwt: { secret: serverEnv.jwt.secret },
    cookie: {
      idKey: 'sigma_sessionId',
      expiresKey: 'sigma_sessionExpiresAt',
    },
  },
})
