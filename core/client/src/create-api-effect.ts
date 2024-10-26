import {
  InternalServerException,
  recreateException,
  RouteException,
} from '@core/exceptions'
import { createEffect, Effect } from 'effector'
import { ClientResponse } from 'hono/client'
import { StatusCode } from 'hono/utils/http-status'

type Options = {
  headers?: Record<string, string>
}

type HonoRpcRouteJson<P, R> = (
  args: { json: P },
  options?: Options,
) => Promise<ClientResponse<R, StatusCode, 'json'>>

type HonoRpcRouteQuery<P, R> = (
  args: { query: P },
  options?: Options,
) => Promise<ClientResponse<R, StatusCode, 'json'>>

export function createApiEffect<F extends 'query' | 'json', P, R>(
  format: F,
  fn: F extends 'query' ? HonoRpcRouteQuery<P, R> : HonoRpcRouteJson<P, R>,
) {
  return createEffect(async (payload: P) => {
    const response = await fn({ [format]: payload } as any)
    const json = await response.json()
    if (response.ok) return json
    const exception = recreateException(json)
    if (exception) throw exception
    throw new InternalServerException()
  }) as Effect<P, R, RouteException<unknown>>
}
