import { Logger, loggerService } from '@core/logger'
import { Redlock } from '@sesamecare-oss/redlock'
import { Redis } from 'ioredis'

type Parser<TValue> = (value: string) => TValue
type Stringifier<TValue> = (value: TValue) => string

export class GlobalEntityBaseService<TValue> {
  protected readonly key: string
  protected readonly ttl: number
  protected readonly logger: Logger
  protected readonly redis: Redis
  protected readonly redlock: Redlock

  protected readonly parse: Parser<TValue> = JSON.parse
  protected readonly stringify: Stringifier<TValue> = JSON.stringify

  constructor(options: {
    redis: Redis
    redlock: Redlock
    key: string
    ttl?: number
  }) {
    this.redis = options.redis
    this.redlock = options.redlock
    this.key = options.key
    this.ttl = options.ttl ?? 60 * 60
    this.logger = loggerService.logger.child('Cache').child(options.key)
  }

  async exists() {
    const response = await this.redis.exists(this.key)
    return response === 1
  }

  async get() {
    const response = await this.redis.get(this.key)
    if (!response) return null
    return this.parse(response)
  }

  async set(value: TValue) {
    try {
      await this.redis.set(this.key, this.stringify(value))
      if (this.ttl !== Infinity) await this.redis.expire(this.key, this.ttl)
    } catch (error) {
      this.logger.error('Failed to set')
      this.logger.error(error)
    }

    return value
  }

  async del() {
    const response = await this.redis.del(this.key)
    return response > 0
  }

  async lock(time: number) {
    return this.redlock.acquire([`{redlock}${this.key}`], time)
  }
}

export class KeyEntityBaseService<TValue> {
  protected readonly keygen: (key: string) => string
  protected readonly ttl: number
  protected readonly parentLogger: Logger
  protected readonly redis: Redis
  protected readonly redlock: Redlock
  protected readonly parse: Parser<TValue> = JSON.parse
  protected readonly stringify: Stringifier<TValue> = JSON.stringify

  constructor(options: {
    redis: Redis
    redlock: Redlock
    keygen: (key: string) => string
    ttl?: number
  }) {
    this.redis = options.redis
    this.redlock = options.redlock
    this.keygen = options.keygen
    this.ttl = options.ttl ?? 60 * 60
    this.parentLogger = loggerService.logger.child('Cache')
  }

  protected logger(key: string): Logger {
    return this.parentLogger.child(this.keygen(key))
  }

  async exists(key: string) {
    const response = await this.redis.exists(this.keygen(key))
    return response === 1
  }

  async get(key: string) {
    const response = await this.redis.get(this.keygen(key))
    if (!response) return null
    return this.parse(response)
  }

  async set(key: string, value: TValue) {
    try {
      await this.redis.set(this.keygen(key), this.stringify(value))
      if (this.ttl !== Infinity)
        await this.redis.expire(this.keygen(key), this.ttl)
    } catch (error) {
      this.logger(key).error('Failed to set', error)
    }

    return value
  }

  async del(key: string) {
    const response = await this.redis.del(this.keygen(key))
    return response > 0
  }

  async lock(key: string, time: number) {
    return this.redlock.acquire([`{redlock}${this.keygen(key)}`], time)
  }
}
