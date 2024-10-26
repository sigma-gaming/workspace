import 'reflect-metadata'
import { LoggerOptionsToken } from '@core/logger'
import { DbOptionsToken } from '@dbs/games-db'
import { CacheVersionToken, RedisOptionsToken } from '@games/redis'
import {
  SessionOptionsToken,
  TelegramBotOptionsToken,
  VkOptionsToken,
} from '@games/services'
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

container.register(SessionOptionsToken, {
  useValue: {
    domain: env.domain,
    jwt: { secret: env.jwt.secret },
  },
})

container.register(TelegramBotOptionsToken, {
  useValue: { token: env.telegram.botToken },
})

container.register(VkOptionsToken, {
  useValue: {
    groupToken: env.vk.groupToken,
    serviceToken: env.vk.serviceToken,
  },
})
