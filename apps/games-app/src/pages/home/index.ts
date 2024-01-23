import { BaseLayout } from '../../layouts/base'
import { createPage, routes } from '../../routing'
import { HomePageView } from './view.tsx'

export const HomePage = createPage({
  route: routes.home,
  view: HomePageView,
  layout: BaseLayout,
})
