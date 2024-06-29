import {
  InternalServerException,
  recreateException,
  RouteException,
} from '@libs/exceptions'
import { createEffect, Effect } from 'effector'
import { ClientResponse } from 'hono/client'
import { StatusCode } from 'hono/utils/http-status'

type HonoRpcRoute<P, R> = (args: {
  json: P
}) => Promise<ClientResponse<R, StatusCode, 'json'>>

export function createApiEffect<P, R>(fn: HonoRpcRoute<P, R>) {
  return createEffect(async (payload: P) => {
    const response = await fn({ json: payload })
    const json = await response.json()
    if (response.ok) return json
    const exception = recreateException(json)
    if (exception) throw exception
    throw new InternalServerException()
  }) as Effect<P, R, RouteException<unknown>>
}
