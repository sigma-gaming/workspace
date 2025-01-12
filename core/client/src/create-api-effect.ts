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
  checkCloudflareChallenge?: boolean
  onCloudflareChallenge?: () => void
}

export const createApiEffectFactory = ({
  onCloudflareChallenge,
  checkCloudflareChallenge = Boolean(onCloudflareChallenge),
}: FactoryOptions = {}) => {
  return function createApiEffect<F extends 'query' | 'json', P, R>(
    format: F,
    fn: F extends 'query' ? HonoRpcRouteQuery<P, R> : HonoRpcRouteJson<P, R>,
  ) {
    const effect = createEffect(async (payload: P) => {
      try {
        const response = await fn({ [format]: payload } as any)
        if (response.ok) return await response.json()

        const contentType = response.headers.get('content-type')

        if (contentType?.includes('application/json')) {
          const exception = recreateException(await response.json())
          if (exception) throw exception
        }

        throw new InternalServerException()
      } catch (error) {
        /**
         * Cloudflare challenge response doesn't have CORS headers,
         * so cross-origin requests will always fail with a TypeError.
         *
         * The only way to check if the request is a Cloudflare challenge
         * is to make a request to the current host.
         */
        if (error instanceof TypeError && checkCloudflareChallenge) {
          const response = await fetch('/')

          if (
            response.status === 403 &&
            response.headers.get('cf-mitigated') === 'challenge'
          ) {
            onCloudflareChallenge?.()
            throw new CloudflareChallengeException()
          }
        }

        throw error
      }
    })

    return effect as Effect<P, R, RouteException<unknown>>
  }
}
