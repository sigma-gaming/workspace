import { BaseLayout } from '../../layouts/base/index.ts'
import { createPage, routes } from '../../routing/index.ts'
import { GamesPageView } from './view.tsx'

export const GamesPage = createPage({
  route: routes.games,
  view: GamesPageView,
  layout: BaseLayout,
})
