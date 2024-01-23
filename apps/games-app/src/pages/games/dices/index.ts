import { BaseLayout } from '../../../layouts/base'
import { createAuthenticatedPage, routes } from '../../../routing'
import { DicesGamePageView } from './view.tsx'

export const DicesGamePage = createAuthenticatedPage({
  route: routes.dicesGame,
  view: DicesGamePageView,
  layout: BaseLayout,
})
