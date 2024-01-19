import { redis } from './redis'

interface Options {
  /**
   * Time to live in seconds
   * @default 3600
   */
  ttl?: number
}

async function set<T>(
  key: string,
  value: T,
  options: Options = {},
): Promise<T> {
  const { ttl = 60 * 60 } = options

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl)
  } catch (error) {
    console.error('Failed to set cache')
    console.error(error)
  }

  return value
}

async function get<T>(key: string): Promise<T | null> {
  const response = await redis.get(key)
  if (!response) return null
  return JSON.parse(response)
}

async function del(key: string): Promise<boolean> {
  const response = await redis.del(key)
  return response > 0
}

interface GlobalEntity<TValue> {
  set: (value: TValue, options?: Options) => Promise<TValue>
  get: () => Promise<TValue | null>
  del: () => Promise<boolean>
}

interface KeyEntity<TArg, TValue> {
  set: (arg: TArg, value: TValue, options?: Options) => Promise<TValue>
  get: (arg: TArg) => Promise<TValue | null>
  del: (arg: TArg) => Promise<boolean>
}

function entity<TKey, TValue>(options: {
  keygen: (key: TKey) => string
  options?: Options
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
      set: (value: TValue, options?: Options) =>
        set(typedKeygen(), value, { ...defaultOptions, ...options }),
      get: () => get<TValue>(typedKeygen()),
      del: () => del(typedKeygen()),
    }

    return entity as ResultingEntity
  }

  const entity: KeyEntity<TKey, TValue> = {
    set: (arg: TKey, value: TValue, options?: Options) =>
      set(keygen(arg), value, { ...defaultOptions, ...options }),
    get: (arg: TKey) => get<TValue>(keygen(arg)),
    del: (arg: TKey) => del(keygen(arg)),
  }

  return entity as ResultingEntity
}

export const cache = {
  set,
  get,
  del,
  entity,
}
