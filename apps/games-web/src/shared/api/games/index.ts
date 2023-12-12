import {
  createTRPCProxyClient,
  createWSClient,
  httpBatchLink,
  TRPCLink,
  wsLink,
} from '@trpc/client'
import { AppRouter } from '@apps/games-api'
import { env, internalEnv } from '../../env'

function createLinks(): TRPCLink<AppRouter>[] {
  if (typeof window !== 'undefined') {
    const wsClient = createWSClient({
      url: env.gamesApi.wsUrl + '/trpc',
    })

    return [wsLink<AppRouter>({ client: wsClient })]
  }

  return [
    httpBatchLink({
      url: internalEnv.gamesApi.internalUrl + '/trpc',
      headers({ opList }) {
        let cookie = ''

        for (const options of opList) {
          if (typeof options.context.cookies !== 'string') continue
          cookie = options.context.cookies
        }

        return { cookie }
      },
    }),
  ]
}

export const gamesApi = createTRPCProxyClient<AppRouter>({
  links: createLinks(),
})

export * from './with-ssr-context.ts'
