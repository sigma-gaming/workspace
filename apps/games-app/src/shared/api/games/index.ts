import { ApiType, SocketEvent, SocketTopic } from '@apis/games-api'
import { createApiSocket } from '@libs/hono-client'
import { hc } from 'hono/client'
import { env } from '../../env'

export const gamesApi = hc<ApiType>(env.gamesApi.url, {
  fetch(input: RequestInfo | URL, requestInit?: RequestInit) {
    return fetch(input, { ...requestInit, credentials: 'include' })
  },
})

export const gamesApiSocket = createApiSocket<SocketTopic, SocketEvent>(
  gamesApi.websocket.$ws,
)
