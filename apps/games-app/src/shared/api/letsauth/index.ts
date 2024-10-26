import { ApiType } from '@apis/letsauth'
import { hc } from 'hono/client'
import { env } from '../../env'

export const { api: letsauthApi } = hc<ApiType>(env.authApi.url, {
  fetch(input: RequestInfo | URL, requestInit?: RequestInit) {
    return fetch(input, { ...requestInit, credentials: 'include' })
  },
})
