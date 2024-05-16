import { GamesAPIRouter } from '@apis/games-api'
import {
  createTRPCProxyClient,
  createWSClient,
  httpBatchLink,
  loggerLink,
  splitLink,
  wsLink,
} from '@trpc/client'
import { env } from '../../env'

const wsClient = createWSClient({
  url: env.gamesApi.wsUrl + '/trpc',
})

export const gamesApi = createTRPCProxyClient<GamesAPIRouter>({
  links: [
    loggerLink({
      enabled() {
        return process.env.NODE_ENV === 'development'
      },
    }),
    splitLink({
      condition(op) {
        return op.type === 'subscription'
      },
      true: wsLink<GamesAPIRouter>({
        client: wsClient,
      }),
      false: httpBatchLink<GamesAPIRouter>({
        url: env.gamesApi.url + '/trpc',
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          })
        },
      }),
    }),
  ],
})
