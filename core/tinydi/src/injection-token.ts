export type Constructable<T> = {
  new (...args: any[]): T
}

export type InjectionToken<T = any> = Constructable<T> | string | symbol

export function isNormalToken(
  token?: InjectionToken,
): token is string | symbol {
  return typeof token === 'string' || typeof token === 'symbol'
}

export function isConstructableToken<T>(
  token?: InjectionToken<T>,
): token is Constructable<T> {
  return typeof token === 'function'
}
