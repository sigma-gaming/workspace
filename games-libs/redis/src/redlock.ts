import { createSingletonProxy } from '@core/di'
import { Redlock } from '@sesamecare-oss/redlock'
import { singleton } from 'tsyringe'
import { RedisService } from './redis'

@singleton()
export class RedlockService {
  redlock: Redlock

  constructor(redisService: RedisService) {
    this.redlock = new Redlock([redisService.redis], {
      // http://redis.io/topics/distlock
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
      automaticExtensionThreshold: 500,
    })
  }
}

export const gamesRedlock = createSingletonProxy(
  RedlockService,
  (service) => service.redlock,
)
