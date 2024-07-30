import { ApiType } from '@apis/games-api'
import { hc } from 'hono/client'
import { env } from '../../env'

export const gamesApi = hc<ApiType>(env.gamesApi.url, {
  fetch(input: RequestInfo | URL, requestInit?: RequestInit) {
    return fetch(input, { ...requestInit, credentials: 'include' })
  },
})
