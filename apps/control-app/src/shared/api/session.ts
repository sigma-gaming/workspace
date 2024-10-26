import { AuthenticateResult } from '@apis/letsauth'
import { AccessTokenPayload } from '@games/model'
import { AccessTokenResponse } from 'apps/letsauth/src/api/types'
import { createEffect, createEvent, createStore, sample } from 'effector'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { env } from '../env'
import { letsauthApi } from './letsauth'

type TokenDecoded = AccessTokenPayload & { exp: number }

if (typeof window !== 'undefined') {
  const url = new URL(window.location.href)
  const query = new URLSearchParams(url.search)
  const flow = query.get('auth')

  if (
    flow === AuthenticateResult.SignedIn ||
    flow === AuthenticateResult.SignedUp
  ) {
    const expiresAt = query.get('sessionExpiresAt')

    if (expiresAt) {
      Cookies.set('sessionExpiresAt', expiresAt, {
        domain: env.domain,
        expires: new Date(expiresAt),
      })
    }

    query.delete('auth')
    query.delete('sessionExpiresAt')

    const newUrl = new URL(window.location.href)
    newUrl.search = query.toString()
    history.replaceState({}, document.title, newUrl)
  }
}

function getSessionExpiresAt() {
  const expiresAt = Cookies.get('sessionExpiresAt')
  return expiresAt ? new Date(expiresAt) : null
}

let refreshTokenPromise: Promise<AccessTokenResponse> | null = null

const refreshTokenFx = createEffect(async () => {
  if (refreshTokenPromise) return refreshTokenPromise

  refreshTokenPromise = letsauthApi.accessToken
    .$get()
    .then((response) => response.json())

  refreshTokenPromise.finally(() => {
    refreshTokenPromise = null
  })

  return refreshTokenPromise
})

const initialize = createEvent()
const clear = createEvent()

const $accessToken = createStore<string | null>(null)
const $sessionExpiresAt = createStore(getSessionExpiresAt())

const $accessTokenDecoded = $accessToken.map((token) => {
  if (!token) return null
  return jwtDecode<TokenDecoded>(token)
})

const $accessTokenExpiresAt = $accessTokenDecoded.map((decoded) => {
  if (!decoded) return null
  return new Date(decoded.exp * 1000)
})

const $sessionActive = $sessionExpiresAt.map(
  (expiresAt) => expiresAt && new Date() < expiresAt,
)

sample({
  clock: refreshTokenFx.doneData,
  fn: ({ accessToken }) => accessToken,
  target: $accessToken,
})

sample({
  clock: clear,
  fn: () => null,
  target: [$accessToken, $sessionExpiresAt],
})

export const $$session = {
  initialize,
  clear,
  refreshTokenFx,
  $accessToken,
  $accessTokenExpiresAt,
  $sessionExpiresAt,
  $sessionActive,
}
