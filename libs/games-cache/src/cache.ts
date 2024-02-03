import { Lock, Redlock } from '@sesamecare-oss/redlock'
import { Redis } from 'ioredis'

interface CacheOptions {
  /**
   * Time to live in seconds
   * @default 3600
   */
  ttl?: number
}

interface GlobalEntity<TValue> {
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

interface KeyEntity<TKey, TValue> {
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

export function createCache(options: {
  redis: Redis
  redlock: Redlock
}): Cache {
  const { redis, redlock } = options

  async function exists(key: string): Promise<boolean> {
    const response = await redis.exists(key)
    return response === 1
  }

  async function get<T>(key: string): Promise<T | null> {
    const response = await redis.call('JSON.GET', key)
    if (!response) return null
    return JSON.parse(String(response))
  }

  async function getField<T>(key: string, field: string): Promise<T | null> {
    const response = await redis.call('JSON.GET', key, field)
    if (!response) return null
    return JSON.parse(String(response))
  }

  async function set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<T> {
    const { ttl = 60 * 60 } = options

    try {
      await redis.call('JSON.SET', key, '$', JSON.stringify(value))
      if (ttl !== Infinity) await redis.expire(key, ttl)
    } catch (error) {
      console.error('Failed to set cache')
      console.error(error)
    }

    return value
  }

  async function setField<T>(key: string, field: string, value: T): Promise<T> {
    try {
      await redis.call('JSON.SET', key, field, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to set cache field')
      throw error
    }

    return value
  }

  async function incField(
    key: string,
    field: string,
    value: number,
  ): Promise<number> {
    try {
      const response = await redis.call('JSON.NUMINCRBY', key, field, value)
      return JSON.parse(String(response))
    } catch (error) {
      console.error('Failed to inc cache field')
      throw error
    }
  }

  async function del(key: string): Promise<boolean> {
    const response = await redis.del(key)
    return response > 0
  }

  async function lock(key: string, time: number): Promise<Lock> {
    return redlock.acquire([`{redlock}${key}`], time)
  }

  function entity<TKey, TValue>(options: {
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
        lock: (time: number) => lock(typedKeygen(), time),
        exists: () => exists(typedKeygen()),
        get: () => get<TValue>(typedKeygen()),
        set: (value: TValue, options?: CacheOptions) => {
          return set(typedKeygen(), value, { ...defaultOptions, ...options })
        },
        del: () => del(typedKeygen()),
        getField: <TField extends keyof TValue>(field: TField) => {
          return getField(typedKeygen(), String(field))
        },
        setField: <TField extends keyof TValue>(
          field: TField,
          value: TValue[TField],
        ) => {
          return setField(typedKeygen(), String(field), value)
        },
        incField: <TField extends keyof TValue>(
          field: TField,
          value: number,
        ) => {
          return incField(typedKeygen(), String(field), value)
        },
      }

      return entity as ResultingEntity
    }

    const entity: KeyEntity<TKey, TValue> = {
      lock: (key: TKey, time: number) => lock(keygen(key), time),
      exists: (key: TKey) => exists(keygen(key)),
      get: (key: TKey) => get<TValue>(keygen(key)),
      set: (key: TKey, value: TValue, options?: CacheOptions) => {
        return set(keygen(key), value, { ...defaultOptions, ...options })
      },
      del: (key: TKey) => del(keygen(key)),
      getField: <TField extends keyof TValue>(key: TKey, field: TField) => {
        return getField(keygen(key), String(field))
      },
      setField: <TField extends keyof TValue>(
        key: TKey,
        field: TField,
        value: TValue[TField],
      ) => {
        return setField(keygen(key), String(field), value)
      },
      incField: <TField extends keyof TValue>(
        key: TKey,
        field: TField,
        value: number,
      ) => {
        return incField(keygen(key), String(field), value)
      },
    }

    return entity as ResultingEntity
  }

  return {
    set,
    get,
    del,
    entity,
  }
}
