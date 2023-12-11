import {
  createTRPCProxyClient,
  createWSClient,
  TRPCLink,
  wsLink,
} from '@trpc/client'
import { AppRouter } from '@apps/games-api'
import { env } from '../../env'

function createLinks(): TRPCLink<AppRouter>[] {
  if (typeof window !== 'undefined') {
    const wsClient = createWSClient({
      url: env.gamesApi.wsUrl + '/trpc',
    })

    return [wsLink<AppRouter>({ client: wsClient })]
  }

  return []
}

export const gamesApi = createTRPCProxyClient<AppRouter>({
  links: createLinks(),
})
