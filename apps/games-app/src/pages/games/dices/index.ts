import { BaseLayout } from '../../../layouts/base'
import { createPage, routes } from '../../../routing'
import { DicesGamePageView } from './view.tsx'

export const DicesGamePage = createPage({
  route: routes.dicesGame,
  view: DicesGamePageView,
  layout: BaseLayout,
})
