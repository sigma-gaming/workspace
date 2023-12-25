import { RouteInstance, RouteParams } from 'atomic-router'
import { CacheSettings, MetaSettings, Page, ViewSettings } from './client-types'

export function createPage<TParams extends RouteParams>(options: {
  route: RouteInstance<TParams>
  view: ViewSettings
  meta?: MetaSettings
  cache?: CacheSettings<TParams>
}): Page<TParams> {
  const { route, view, meta, cache } = options

  return {
    route,
    view: view.render,
    meta,
    cache,
  }
}
