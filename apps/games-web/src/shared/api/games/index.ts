import {
  createTRPCProxyClient,
  createWSClient,
  httpBatchLink,
  loggerLink,
  TRPCLink,
  wsLink,
} from '@trpc/client'
import { AppRouter } from '@apps/games-api'
import { env, internalEnv } from '../../env'

function createLinks(): TRPCLink<AppRouter>[] {
  const links: TRPCLink<AppRouter>[] = []

  links.push(
    loggerLink({
      enabled(options) {
        if (process.env.NODE_ENV === 'development') return true
        return options.direction === 'down' && options.result instanceof Error
      },
    }),
  )

  /**
   * Client-side requests
   */
  if (typeof window !== 'undefined') {
    const wsClient = createWSClient({
      url: env.gamesApi.wsUrl + '/trpc',
    })

    links.push(wsLink<AppRouter>({ client: wsClient }))
  }

  /**
   * Server-side requests
   */
  if (typeof window === 'undefined') {
    const link = httpBatchLink<AppRouter>({
      url: env.gamesApi.url + '/trpc',
      headers({ opList }) {
        let cookie = ''

        for (const options of opList) {
          if (typeof options.context.cookies !== 'string') continue
          cookie = options.context.cookies
        }

        return {
          cookie,
          'CF-Access-Client-Id': internalEnv.cloudflare.accessClientId,
          'CF-Access-Client-Secret': internalEnv.cloudflare.accessClientSecret,
        }
      },
    })

    links.push(link)
  }

  return links
}

export const gamesApi = createTRPCProxyClient<AppRouter>({
  links: createLinks(),
})
