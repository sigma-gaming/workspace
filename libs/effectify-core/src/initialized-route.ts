import { chainRoute, RouteInstance, RouteParams } from 'atomic-router'
import { createEffect, sample } from 'effector'
import { previous } from 'patronum'
import { $$effectify } from './global'

export interface CreateInitializedRouteOptions {
  clientOnly?: boolean
  serverOnly?: boolean
}

export function createInitializedRoute<TParams extends RouteParams>(
  route: RouteInstance<TParams>,
  options: CreateInitializedRouteOptions = {},
): RouteInstance<TParams> {
  const beforeOpenFx = createEffect(() => true)

  const $previousOpened = previous(route.$isOpened)

  const openedOnNavigation = sample({
    clock: route.opened,
    source: {
      previousOpened: $previousOpened,
      opened: route.$isOpened,
    },
    filter: ({ previousOpened, opened }) => {
      return typeof window !== 'undefined' && opened && previousOpened === false
    },
  })

  const serverTriggered = sample({
    clock: [$$effectify.serverStarted],
    filter: () => !options.clientOnly,
  })

  const clientTriggered = sample({
    clock: [$$effectify.clientStarted],
    filter: () => !options.serverOnly,
  })

  const chained = chainRoute({
    route,
    beforeOpen: {
      effect: beforeOpenFx,
      mapParams: (params) => params,
    },
    openOn: [serverTriggered, openedOnNavigation],
  })

  type EmptyObject = {
    [key in string]: never
  }

  /**
   * Chained route is not triggered automatically after hydration,
   * so we need to trigger it manually using the sample
   */
  sample({
    clock: clientTriggered,
    source: { opened: route.$isOpened, params: route.$params },
    filter: ({ opened }) => opened,
    fn: ({ params }) => params as TParams extends EmptyObject ? void : TParams,
    target: chained.open,
  })

  return chained
}
