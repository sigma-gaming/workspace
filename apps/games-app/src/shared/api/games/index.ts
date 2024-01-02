import {
  createTRPCProxyClient,
  createWSClient,
  httpBatchLink,
  loggerLink,
  splitLink,
  wsLink,
} from '@trpc/client'
import { AppRouter } from '@apps/games-api'
import { env } from '../../env'

const wsClient = createWSClient({
  url: env.gamesApi.wsUrl + '/trpc',
})

export const gamesApi = createTRPCProxyClient<AppRouter>({
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
      true: wsLink<AppRouter>({ client: wsClient }),
      false: httpBatchLink<AppRouter>({
        url: env.gamesApi.url + '/trpc',
        fetch(url, options) {
          console.log(url, options)

          return fetch(url, {
            ...options,
            credentials: 'include',
          })
        },
      }),
    }),
  ],
})
