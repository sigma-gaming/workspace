import { Redlock } from '@sesamecare-oss/redlock'
import { Redis } from 'ioredis'

export class RedlockService {
  redlock: Redlock

  constructor(redis: Redis) {
    this.redlock = new Redlock([redis], {
      // http://redis.io/topics/distlock
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
      automaticExtensionThreshold: 500,
    })
  }
}
