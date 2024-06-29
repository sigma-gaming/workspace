import { Logger, LoggerService } from '@core/logger'
import { Lock, Redlock } from '@sesamecare-oss/redlock'
import { Redis } from 'ioredis'
import { singleton } from 'tsyringe'
import { RedisService } from '../redis'
import { RedlockService } from '../redlock'

interface CacheOptions {
  /**
   * Time to live in seconds
   * @default 3600
   */
  ttl?: number
}

export interface GlobalEntity<TValue> {
  lock: (time: number) => Promise<Lock>
  exists: () => Promise<boolean>
  get: () => Promise<TValue | null>
  set: (value: TValue, options?: CacheOptions) => Promise<TValue>
  del: () => Promise<boolean>
  getField: <TField extends keyof TValue>(
    field: TField,
  ) => Promise<TValue[TField] | null>
  setField: <TField extends keyof TValue>(
    field: TField,
    value: TValue[TField],
  ) => Promise<TValue[TField]>
  incField: <TField extends keyof TValue>(
    field: TField,
    value: number,
  ) => Promise<number>
}

export interface KeyEntity<TKey, TValue> {
  lock: (key: TKey, time: number) => Promise<Lock>
  exists: (key: TKey) => Promise<boolean>
  get: (key: TKey) => Promise<TValue | null>
  set: (key: TKey, value: TValue, options?: CacheOptions) => Promise<TValue>
  del: (key: TKey) => Promise<boolean>
  getField: <TField extends keyof TValue>(
    key: TKey,
    field: TField,
  ) => Promise<TValue[TField] | null>
  setField: <TField extends keyof TValue>(
    key: TKey,
    field: TField,
    value: TValue[TField],
  ) => Promise<TValue[TField]>
  incField: <TField extends keyof TValue>(
    key: TKey,
    field: TField,
    value: number,
  ) => Promise<number>
}

export interface Cache {
  set: <T>(key: string, value: T, options?: CacheOptions) => Promise<T>
  get: <T>(key: string) => Promise<T | null>
  del: (key: string) => Promise<boolean>
  entity: <TKey, TValue>(options: {
    keygen: (key: TKey) => string
    options?: CacheOptions
  }) => TKey extends void ? GlobalEntity<TValue> : KeyEntity<TKey, TValue>
}

@singleton()
export class CacheService {
  private readonly logger: Logger
  private readonly redis: Redis
  private readonly redlock: Redlock

  constructor(
    redisService: RedisService,
    redlockService: RedlockService,
    loggerService: LoggerService,
  ) {
    this.redis = redisService.redis
    this.redlock = redlockService.redlock
    this.logger = loggerService.logger.child('GamesCache')
  }

  async exists(key: string): Promise<boolean> {
    const response = await this.redis.exists(key)
    return response === 1
  }

  async get<T>(key: string): Promise<T | null> {
    const response = await this.redis.call('JSON.GET', key)
    if (!response) return null
    return JSON.parse(String(response))
  }

  async getField<T>(key: string, field: string): Promise<T | null> {
    const response = await this.redis.call('JSON.GET', key, field)
    if (!response) return null
    return JSON.parse(String(response))
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<T> {
    const { ttl = 60 * 60 } = options

    try {
      await this.redis.call('JSON.SET', key, '$', JSON.stringify(value))
      if (ttl !== Infinity) await this.redis.expire(key, ttl)
    } catch (error) {
      this.logger.error('Failed to set cache')
      this.logger.error(error)
    }

    return value
  }

  async setField<T>(key: string, field: string, value: T): Promise<T> {
    try {
      await this.redis.call('JSON.SET', key, field, JSON.stringify(value))
    } catch (error) {
      this.logger.error('Failed to set cache field')
      throw error
    }

    return value
  }

  async incField(key: string, field: string, value: number): Promise<number> {
    try {
      const response = await this.redis.call(
        'JSON.NUMINCRBY',
        key,
        field,
        value,
      )
      return JSON.parse(String(response))
    } catch (error) {
      this.logger.error('Failed to inc cache field')
      throw error
    }
  }

  async del(key: string): Promise<boolean> {
    const response = await this.redis.del(key)
    return response > 0
  }

  async lock(key: string, time: number): Promise<Lock> {
    return this.redlock.acquire([`{redlock}${key}`], time)
  }

  entity<TKey, TValue>(options: {
    keygen: (key: TKey) => string
    options?: CacheOptions
  }): TKey extends void ? GlobalEntity<TValue> : KeyEntity<TKey, TValue> {
    type ResultingEntity = TKey extends void
      ? GlobalEntity<TValue>
      : KeyEntity<TKey, TValue>

    const { keygen, options: defaultOptions } = options

    const argumentsLength = options.keygen.length

    if (argumentsLength > 1) {
      throw new Error('Keygen must take 0 or 1 arguments')
    }

    if (argumentsLength === 0) {
      const typedKeygen = keygen as () => string

      const entity: GlobalEntity<TValue> = {
        lock: (time: number) => this.lock(typedKeygen(), time),
        exists: () => this.exists(typedKeygen()),
        get: () => this.get<TValue>(typedKeygen()),
        set: (value: TValue, options?: CacheOptions) => {
          return this.set(typedKeygen(), value, {
            ...defaultOptions,
            ...options,
          })
        },
        del: () => this.del(typedKeygen()),
        getField: <TField extends keyof TValue>(field: TField) => {
          return this.getField(typedKeygen(), String(field))
        },
        setField: <TField extends keyof TValue>(
          field: TField,
          value: TValue[TField],
        ) => {
          return this.setField(typedKeygen(), String(field), value)
        },
        incField: <TField extends keyof TValue>(
          field: TField,
          value: number,
        ) => {
          return this.incField(typedKeygen(), String(field), value)
        },
      }

      return entity as ResultingEntity
    }

    const entity: KeyEntity<TKey, TValue> = {
      lock: (key: TKey, time: number) => this.lock(keygen(key), time),
      exists: (key: TKey) => this.exists(keygen(key)),
      get: (key: TKey) => this.get<TValue>(keygen(key)),
      set: (key: TKey, value: TValue, options?: CacheOptions) => {
        return this.set(keygen(key), value, { ...defaultOptions, ...options })
      },
      del: (key: TKey) => this.del(keygen(key)),
      getField: <TField extends keyof TValue>(key: TKey, field: TField) => {
        return this.getField(keygen(key), String(field))
      },
      setField: <TField extends keyof TValue>(
        key: TKey,
        field: TField,
        value: TValue[TField],
      ) => {
        return this.setField(keygen(key), String(field), value)
      },
      incField: <TField extends keyof TValue>(
        key: TKey,
        field: TField,
        value: number,
      ) => {
        return this.incField(keygen(key), String(field), value)
      },
    }

    return entity as ResultingEntity
  }
}
