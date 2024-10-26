import {
  InternalServerException,
  recreateException,
  RouteException,
  SessionExpiredException,
} from '@core/exceptions'
import { attach, Effect, Store } from 'effector'
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

export const protectedApiEffectFactory = ({
  $accessToken,
  $accessTokenExpiresAt,
  refresh,
}: {
  $accessToken: Store<string | null>
  $accessTokenExpiresAt: Store<Date | null>
  refresh: () => Promise<string>
}) => {
  let refreshPromise: Promise<string> | null = null

  return function createProtectedApiEffect<F extends 'query' | 'json', P, R>(
    format: F,
    fn: F extends 'query' ? HonoRpcRouteQuery<P, R> : HonoRpcRouteJson<P, R>,
  ) {
    function refreshToken() {
      if (refreshPromise) return refreshPromise
      refreshPromise = refresh()
      refreshPromise.finally(() => (refreshPromise = null))
      return refreshPromise
    }

    return attach({
      source: {
        accessToken: $accessToken,
        accessTokenExpiresAt: $accessTokenExpiresAt,
      },
      async effect({ accessToken, accessTokenExpiresAt }, payload: P) {
        if (
          !accessToken ||
          !accessTokenExpiresAt ||
          accessTokenExpiresAt < new Date()
        ) {
          accessToken = await refreshToken()
        }

        let tries = 0

        while (tries < 2) {
          tries += 1

          const response = await fn({ [format]: payload } as any, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })

          const json = await response.json()
          if (response.ok) return json
          const exception = recreateException(json)

          if (exception instanceof SessionExpiredException) {
            accessToken = await refreshToken()
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
