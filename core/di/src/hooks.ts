import { InjectionToken } from 'tsyringe'

export interface OnApplicationShutdown {
  shutdownBefore?: InjectionToken<unknown>[]
  onApplicationShutdown(signal?: string): void | Promise<void>
}

export function implementsApplicationShutdown(
  object: unknown,
): object is OnApplicationShutdown {
  return (
    typeof object === 'object' &&
    object !== null &&
    'onApplicationShutdown' in object
  )
}
