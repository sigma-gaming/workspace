import { createLinkedHashMap } from './linked-hash-map'

interface Options {
  maxEntries?: number
}

interface CacheEntry<T> {
  key: string
  value: T
  expiresAt: number
}

export function createMemoryLRUCache<T>({ maxEntries = 250 }: Options = {}) {
  /**
   * The newest entry is at the start of the list
   * The oldest entry is at the end of the list (for easy removal)
   */
  const cache = createLinkedHashMap<CacheEntry<T>>()

  function get(key: string) {
    const entry = cache.extract(key)
    if (!entry) return null

    if (Date.now() < entry.expiresAt) {
      cache.unshift(key, entry)
    }

    return entry.value
  }

  function set(key: string, value: T, ttl?: number) {
    if (cache.length >= maxEntries) {
      cache.pop()
    }

    cache.push(key, {
      key,
      value,
      expiresAt: ttl ? Date.now() + ttl : Infinity,
    })
  }

  function clear() {
    cache.clear()
  }

  return {
    get,
    set,
    clear,
  }
}
