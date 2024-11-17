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
  let instance: T | null = null

  return new Proxy({} as V, {
    get(_, prop: keyof V) {
      instance ??= new Factory()
      if (!selector) return instance[prop]
      return selector(instance)[prop]
    },
  })
}
