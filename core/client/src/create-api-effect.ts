import {
  CloudflareChallengeException,
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

type FactoryOptions = {
  onCloudflareChallenge?: () => void
}

export const createApiEffectFactory = ({
  onCloudflareChallenge,
}: FactoryOptions = {}) => {
  return function createApiEffect<F extends 'query' | 'json', P, R>(
    format: F,
    fn: F extends 'query' ? HonoRpcRouteQuery<P, R> : HonoRpcRouteJson<P, R>,
  ) {
    return createEffect(async (payload: P) => {
      const response = await fn({ [format]: payload } as any)
      if (response.ok) return await response.json()

      const contentType = response.headers.get('content-type')

      if (response.status === 403 && contentType?.includes('text/plain')) {
        console.info('Headers', Object.fromEntries(response.headers.entries()))
        onCloudflareChallenge?.()
        throw new CloudflareChallengeException()
      }

      if (contentType?.includes('application/json')) {
        const exception = recreateException(await response.json())
        if (exception) throw exception
      }

      throw new InternalServerException()
    }) as Effect<P, R, RouteException<unknown>>
  }
}
