import {
  InternalServerException,
  recreateException,
  RouteException,
  SessionExpiredException,
} from '@core/exceptions'
import { attach, createEffect, Effect, Store } from 'effector'
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

export const createApiEffectFactory = ({
  authentication,
}: {
  authentication: {
    condition: Store<boolean>
    token: Store<string | null>
    tokenExpiresAt: Store<string | null>
    refresh: () => Promise<string>
  }
}) => {
  return function createApiEffect<F extends 'query' | 'json', P, R>(
    format: F,
    fn: F extends 'query' ? HonoRpcRouteQuery<P, R> : HonoRpcRouteJson<P, R>,
  ) {
    const commonFx = createEffect(async (payload: P) => {
      const response = await fn({ [format]: payload } as any)
      const json = await response.json()
      if (response.ok) return json
      const exception = recreateException(json)
      if (exception) throw exception
      throw new InternalServerException()
    }) as Effect<P, R, RouteException<unknown>>

    return attach({
      source: {
        condition: authentication.condition,
        token: authentication.token,
        tokenExpiresAt: authentication.tokenExpiresAt,
      },
      async effect({ condition, token, tokenExpiresAt }, payload: P) {
        if (!condition) return commonFx(payload)

        if (
          !token ||
          !tokenExpiresAt ||
          new Date(tokenExpiresAt) < new Date()
        ) {
          token = await authentication.refresh()
        }

        let tries = 0

        while (tries < 2) {
          tries += 1

          const response = await fn({ [format]: payload } as any, {
            headers: { Authorization: `Bearer ${token}` },
          })

          const json = await response.json()
          if (response.ok) return json
          const exception = recreateException(json)

          if (exception instanceof SessionExpiredException) {
            token = await authentication.refresh()
            continue
          }

          if (exception) throw exception
          throw new InternalServerException()
        }

        throw new InternalServerException()
      },
    }) as Effect<P, R, RouteException<unknown>>
  }
}
