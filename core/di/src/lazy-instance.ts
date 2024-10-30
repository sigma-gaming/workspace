type RecordLike = {
  [key: string | number | symbol]: any
}

export const createLazyInstance = <
  T extends RecordLike,
  V extends RecordLike = T,
>(
  Factory: new () => T,
  selector?: (instance: T) => V,
) => {
  let cached: T | null = null

  return new Proxy({} as V, {
    get(_, prop: keyof V) {
      const service = cached ?? new Factory()
      if (!cached) cached = service
      if (!selector) return service[prop]
      return selector(service)[prop]
    },
  })
}
