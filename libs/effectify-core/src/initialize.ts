import { createHistoryRouter } from 'atomic-router'
import { allSettled, is, Scope } from 'effector'
import { createMemoryHistory } from 'history'
import { Page } from './client-types'
import { CacheSettingsCalculated } from './server-types'

interface InitializeOptions {
  url: string
  scope: Scope
  router: ReturnType<typeof createHistoryRouter>
  pages: Page[]
}

interface InitializeResult {
  scope: Scope
  page: Page | null
  cache: CacheSettingsCalculated | null
}

export async function initialize({
  url,
  scope,
  router,
  pages,
}: InitializeOptions): Promise<InitializeResult> {
  const history = createMemoryHistory({ initialEntries: ['/' + url] })
  await allSettled(router.setHistory, { scope, params: history })

  const page =
    pages.find((page) => {
      return scope.getState(page.route.$isOpened)
    }) ?? null

  let cache = null

  if (page?.cache) {
    let keyString = null

    const route = router.routes.find((object) => {
      return object.route === page.route
    })

    const urlUsed = !page.cache.key || typeof page.cache.key === 'function'

    if (!route && urlUsed)
      console.warn(
        'Route not found in "routes" object of Router, falling back to full url',
      )

    const state = {
      url: route?.path ?? url,
      params: scope.getState(page.route.$params),
      query: scope.getState(page.route.$query),
    }

    const { key = JSON.stringify(state), ttl } = page.cache

    if (is.store(key)) {
      keyString = scope.getState(key)
    } else if (typeof key === 'function') {
      keyString = key(state)
    } else {
      keyString = key
    }

    cache = {
      key: keyString,
      ttl,
    }
  }

  return { scope, page, cache }
}
