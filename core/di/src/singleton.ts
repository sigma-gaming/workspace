import { container } from 'tsyringe-neo'

type RecordLike = {
  [key: string | number | symbol]: any
}

export const createSingletonProxy = <
  T extends RecordLike,
  V extends RecordLike = T,
>(
  factory: new (...options: any[]) => T,
  selector?: (instance: T) => V,
) => {
  return new Proxy({} as V, {
    get(_, prop: keyof V) {
      const service = container.resolve(factory)
      if (!selector) return service[prop]
      return selector(service)[prop]
    },
  })
}
