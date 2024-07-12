import { Logger, LoggerService } from '@core/logger'
import { Redlock } from '@sesamecare-oss/redlock'
import { Redis } from 'ioredis'
import { autoInjectable } from 'tsyringe'
import { RedisService } from '../redis'
import { RedlockService } from '../redlock'

type Parser<TValue> = (value: string) => TValue
type Stringifier<TValue> = (value: TValue) => string

@autoInjectable()
export class GlobalEntityBaseService<TValue> {
  protected readonly key: string
  protected readonly ttl: number
  protected readonly logger: Logger
  protected readonly redis: Redis
  protected readonly redlock: Redlock
  protected readonly parse: Parser<TValue> = JSON.parse
  protected readonly stringify: Stringifier<TValue> = JSON.stringify

  constructor(
    options: { key: string; ttl?: number },
    redisService?: RedisService,
    redlockService?: RedlockService,
    loggerService?: LoggerService,
  ) {
    this.redis = redisService!.redis
    this.redlock = redlockService!.redlock
    this.logger = loggerService!.logger.child('Cache').child(options.key)
    this.key = options.key
    this.ttl = options.ttl ?? 60 * 60
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
      this.logger.error('Failed to set', error)
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

@autoInjectable()
export class KeyEntityBaseService<TValue> {
  protected readonly keygen: (key: string) => string
  protected readonly ttl: number
  protected readonly parentLogger: Logger
  protected readonly redis: Redis
  protected readonly redlock: Redlock
  protected readonly parse: Parser<TValue> = JSON.parse
  protected readonly stringify: Stringifier<TValue> = JSON.stringify

  constructor(
    options: { keygen: (key: string) => string; ttl?: number },
    redisService?: RedisService,
    redlockService?: RedlockService,
    loggerService?: LoggerService,
  ) {
    this.redis = redisService!.redis
    this.redlock = redlockService!.redlock
    this.parentLogger = loggerService!.logger.child('Cache')
    this.keygen = options.keygen
    this.ttl = options.ttl ?? 60 * 60
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
