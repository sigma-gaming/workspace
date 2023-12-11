import {
  CreateTRPCProxyClient,
  createTRPCUntypedClient,
  createWSClient,
  httpBatchLink,
  TRPCLink,
  TRPCUntypedClient,
  wsLink,
} from '@trpc/client'
import type { AnyRouter, ProcedureType } from '@trpc/server'
import { attach, Store } from 'effector'
import { AppRouter } from '@apps/games-api'
import { env } from '../../env'
import { $$ssrContext, SSRContext } from '../ssr-context.ts'

function createLinks(): TRPCLink<AppRouter>[] {
  if (typeof window !== 'undefined') {
    const wsClient = createWSClient({
      url: env.gamesApi.wsUrl + '/trpc',
    })

    return [wsLink<AppRouter>({ client: wsClient })]
  }

  return [
    httpBatchLink({
      url: env.gamesApi.internalUrl + '/trpc',
      fetch(url, options) {
        return fetch(url, options)
      },
      headers({ opList }) {
        return {
          Cookie: opList[0].context.cookies as string,
        }
      },
    }),
  ]
}

const untypedClient = createTRPCUntypedClient<AppRouter>({
  links: createLinks(),
})

export const gamesApi = createTRPCClientWithContext<AppRouter, SSRContext>({
  untypedClient,
  contextStore: $$ssrContext.$context,
})

interface CreateTRPCClientWithContext<
  T extends AnyRouter,
  C extends Record<string, unknown>,
> {
  untypedClient: TRPCUntypedClient<T>
  contextStore: Store<C>
  parentPath?: string[]
}

function createTRPCClientWithContext<
  T extends AnyRouter,
  C extends Record<string, unknown>,
>(options: CreateTRPCClientWithContext<T, C>): CreateTRPCProxyClient<T> {
  const { untypedClient, contextStore, parentPath = [] } = options

  const proxy = new Proxy(new Function(), {
    get(target, prop: string) {
      let method: ProcedureType | null = null

      if (prop === 'query') method = 'query'
      if (prop === 'mutate') method = 'mutation'
      if (prop === 'subscribe') method = 'subscription'

      if (method) {
        return attach({
          source: contextStore,
          effect(context, input?: unknown) {
            return untypedClient[method!](parentPath.join('.'), input, {
              context,
            })
          },
        })
      }

      return createTRPCClientWithContext({
        ...options,
        parentPath: parentPath.concat(prop),
      })
    },
  })

  return proxy as unknown as CreateTRPCProxyClient<T>
}
