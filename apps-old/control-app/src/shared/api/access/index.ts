import { ApiType } from '@apis/access-api'
import { hc } from 'hono/client'
import { env } from '../../env'

export const accessApi = hc<ApiType>(env.accessApi.url, {
  fetch(input: RequestInfo | URL, requestInit?: RequestInit) {
    return fetch(input, { ...requestInit, credentials: 'include' })
  },
})
