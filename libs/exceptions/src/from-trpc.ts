import * as exceptions from './exceptions'

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null
}

export function fromTrpc(error: unknown) {
  if (
    isObject(error) &&
    'data' in error &&
    isObject(error.data) &&
    'error' in error.data &&
    typeof error.data.error === 'string' &&
    error.data.error in exceptions
  ) {
    const Factory = exceptions[error.data.error as 'RouteException']
    let payload: unknown
    if ('payload' in error.data) payload = error.data.payload
    return new Factory(payload)
  }

  throw new Error('Invalid error')
}
