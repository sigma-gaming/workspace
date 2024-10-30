import { Logger, loggerService } from '@core/logger'
import { Redlock } from '@sesamecare-oss/redlock'
import { Redis } from 'ioredis'

type Parser<TValue> = (value: string) => TValue
type Stringifier<TValue> = (value: TValue) => string

export class GlobalEntityListService<TValue> {
  protected readonly key: string
  protected readonly ttl: number
  protected readonly max: number
  protected readonly logger: Logger
  protected readonly redis: Redis
  protected readonly redlock: Redlock
  protected readonly parse: Parser<TValue> = JSON.parse
  protected readonly stringify: Stringifier<TValue> = JSON.stringify

  constructor(options: {
    redis: Redis
    redlock: Redlock
    key: string
    max?: number
    ttl?: number
  }) {
    this.redis = options.redis
    this.redlock = options.redlock
    this.key = options.key
    this.ttl = options.ttl ?? 60 * 60
    this.max = options.max ?? 100
    this.logger = loggerService.logger.child('Cache').child(options.key)
  }

  async exists() {
    const count = await this.redis.exists(this.key)
    return count > 0
  }

  async extend() {
    if (this.ttl === Infinity) return
    await this.redis.expire(this.key, this.ttl)
  }

  async get(count = this.max) {
    const list = await this.redis.lrange(this.key, 0, count - 1)
    return list.map((value) => this.parse(value))
  }

  async push(value: TValue) {
    try {
      const length = await this.redis.rpush(this.key, this.stringify(value))
      if (this.ttl !== Infinity) await this.redis.expire(this.key, this.ttl)
      if (length > this.max) await this.redis.ltrim(this.key, 1, this.max)
      return length
    } catch (error) {
      this.logger.error('Failed to push', error)
      throw error
    }
  }

  async unshift(value: TValue) {
    try {
      const length = await this.redis.lpush(this.key, this.stringify(value))
      if (this.ttl !== Infinity) await this.redis.expire(this.key, this.ttl)
      if (length > this.max) await this.redis.ltrim(this.key, 0, this.max - 1)
      return length
    } catch (error) {
      this.logger.error('Failed to unshift', error)
      throw error
    }
  }

  async pushMany(values: TValue[]) {
    try {
      const length = await this.redis.lpush(
        this.key,
        ...values.map((value) => this.stringify(value)),
      )

      if (this.ttl !== Infinity) await this.redis.expire(this.key, this.ttl)
      if (length > this.max) await this.redis.ltrim(this.key, 0, this.max - 1)
      return length
    } catch (error) {
      this.logger.error('Failed to pushMany', error)
      throw error
    }
  }

  async set(values: TValue[]) {
    if (values.length === 0) {
      await this.empty()
      return 0
    }

    try {
      // Use rpush to avoid reversing the values
      const length = await this.redis.rpush(
        this.key,
        ...values.map((value) => this.stringify(value)),
      )

      if (length > values.length)
        await this.redis.ltrim(this.key, length - values.length, -1)

      if (this.ttl !== Infinity) await this.redis.expire(this.key, this.ttl)

      if (length > this.max) await this.redis.ltrim(this.key, 0, this.max - 1)

      return length
    } catch (error) {
      this.logger.error('Failed to set', error)
      throw error
    }
  }

  async empty() {
    const response = await this.redis.del(this.key)
    return response > 0
  }

  async lock(time: number) {
    return this.redlock.acquire([`{redlock}${this.key}`], time)
  }
}

export class KeyEntityListService<TValue> {
  protected readonly keygen: (key: string) => string
  protected readonly ttl: number
  protected readonly max: number
  protected readonly parentLogger: Logger
  protected readonly redis: Redis
  protected readonly redlock: Redlock
  protected readonly parse: Parser<TValue> = JSON.parse
  protected readonly stringify: Stringifier<TValue> = JSON.stringify

  constructor(options: {
    redis: Redis
    redlock: Redlock
    keygen: (key: string) => string
    max?: number
    ttl?: number
  }) {
    this.redis = options.redis
    this.redlock = options.redlock
    this.keygen = options.keygen
    this.ttl = options.ttl ?? 60 * 60
    this.max = options.max ?? 100
    this.parentLogger = loggerService.logger.child('Cache')
  }

  async exists(key: string) {
    const count = await this.redis.exists(this.keygen(key))
    return count > 0
  }

  async get(key: string, count = this.max) {
    const list = await this.redis.lrange(this.keygen(key), 0, count - 1)
    return list.map((value) => this.parse(value))
  }

  async push(key: string, value: TValue) {
    try {
      const length = await this.redis.rpush(
        this.keygen(key),
        this.stringify(value),
      )

      if (this.ttl !== Infinity)
        await this.redis.expire(this.keygen(key), this.ttl)

      if (length > this.max)
        await this.redis.ltrim(this.keygen(key), 1, this.max)

      return length
    } catch (error) {
      this.parentLogger.error('Failed to push', error)
      throw error
    }
  }

  async unshift(key: string, value: TValue) {
    try {
      const length = await this.redis.lpush(
        this.keygen(key),
        this.stringify(value),
      )

      if (this.ttl !== Infinity)
        await this.redis.expire(this.keygen(key), this.ttl)

      if (length > this.max)
        await this.redis.ltrim(this.keygen(key), 0, this.max - 1)

      return length
    } catch (error) {
      this.parentLogger.error('Failed to unshift', error)
      throw error
    }
  }

  async pushMany(key: string, values: TValue[]) {
    try {
      const length = await this.redis.lpush(
        this.keygen(key),
        ...values.map((value) => this.stringify(value)),
      )

      if (this.ttl !== Infinity)
        await this.redis.expire(this.keygen(key), this.ttl)

      if (length > this.max)
        await this.redis.ltrim(this.keygen(key), 0, this.max - 1)

      return length
    } catch (error) {
      this.parentLogger.error('Failed to pushMany', error)
      throw error
    }
  }

  async set(key: string, values: TValue[]) {
    if (values.length === 0) {
      await this.empty(this.keygen(key))
      return 0
    }

    try {
      // Use rpush to avoid reversing the values
      const length = await this.redis.rpush(
        this.keygen(key),
        ...values.map((value) => this.stringify(value)),
      )

      if (length > values.length)
        await this.redis.ltrim(this.keygen(key), length - values.length, -1)

      if (this.ttl !== Infinity)
        await this.redis.expire(this.keygen(key), this.ttl)

      if (length > this.max)
        await this.redis.ltrim(this.keygen(key), 0, this.max - 1)

      return length
    } catch (error) {
      this.parentLogger.error('Failed to set', error)
      throw error
    }
  }

  async empty(key: string) {
    const response = await this.redis.del(this.keygen(key))
    return response > 0
  }

  async lock(key: string, time: number) {
    return this.redlock.acquire([`{redlock}${this.keygen(key)}`], time)
  }
}
