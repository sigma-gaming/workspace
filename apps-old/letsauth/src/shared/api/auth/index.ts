import { hc } from 'hono/client'
import type { ApiType } from '../../../api/api'

export const { api: authApi } = hc<ApiType>('/', {
  fetch(input: RequestInfo | URL, requestInit?: RequestInit) {
    return fetch(input, { ...requestInit, credentials: 'include' })
  },
})
