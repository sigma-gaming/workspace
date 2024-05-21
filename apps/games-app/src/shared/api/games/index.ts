import {
  createTRPCProxyClient,
  createWSClient,
  httpLink,
  loggerLink,
  splitLink,
  wsLink,
} from '@trpc/client'
import { GamesAPIRouter } from 'apps/games-api/src/client'
import { createEffect } from 'effector'
import { env } from '../../env'

const wsClient = createWSClient({
  url: env.gamesApi.wsUrl + '/trpc',
})

/**
 * Used when the authentication state has changed to restart the socket with a new Cookie
 */
export const restartGamesApiSocketFx = createEffect(() => {
  wsClient.getConnection().close()
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
      false: httpLink<GamesAPIRouter>({
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
