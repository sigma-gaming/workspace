import { CenteredLayout } from '../../layouts/centered'
import { createPage, routes } from '../../routing'
import { LoadingPageView } from './view.tsx'

export const LoadingPage = createPage({
  route: routes.loading,
  view: LoadingPageView,
  layout: CenteredLayout,
})
