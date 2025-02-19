import {
  CloudflareChallengeException,
  HttpException,
  mapException,
} from '@core/exceptions'
import { createEffect, Effect } from 'effector'

type FactoryOptions = {
  checkCloudflareChallenge?: boolean
  onCloudflareChallenge?: () => void
}

type NormalizePayload<P> = undefined extends P
  ? Exclude<P, undefined> | void
  : P

export const createApiEffectFactory = ({
  onCloudflareChallenge,
  checkCloudflareChallenge = Boolean(onCloudflareChallenge),
}: FactoryOptions = {}) => {
  return function createApiEffect<P, R>(fn: (payload: P) => Promise<R>) {
    const effect = createEffect(async (payload: P) => {
      try {
        const response = await fn(payload)
        return response
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

        if (error instanceof HttpException) {
          throw mapException(error)
        }

        console.error(error)
        throw error
      }
    })

    return effect as Effect<NormalizePayload<P>, R, HttpException>
  }
}
