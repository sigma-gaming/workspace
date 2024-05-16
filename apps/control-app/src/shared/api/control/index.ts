import { ControlAPIRouter } from '@apis/control-api'
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
  url: env.controlApi.wsUrl + '/trpc',
})

export const controlApi = createTRPCProxyClient<ControlAPIRouter>({
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
      true: wsLink<ControlAPIRouter>({
        client: wsClient,
      }),
      false: httpBatchLink<ControlAPIRouter>({
        url: env.controlApi.url + '/trpc',
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
