import * as exceptions from './exceptions'
import { RouteException } from './exceptions'

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null
}

export function recreateException(
  error: unknown,
): RouteException<unknown> | null {
  if (
    isObject(error) &&
    'name' in error &&
    typeof error.name === 'string' &&
    error.name in exceptions
  ) {
    const Factory = exceptions[error.name as 'RouteException']
    let payload: unknown
    if ('payload' in error) payload = error.payload
    return new Factory(payload)
  }

  return null
}
