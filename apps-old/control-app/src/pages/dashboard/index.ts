import { BaseLayout } from '../../layouts/base/index.ts'
import { createPage, routes } from '../../routing/index.ts'
import { DashboardPageView } from './view.tsx'

export const DashboardPage = createPage({
  route: routes.dashboard,
  view: DashboardPageView,
  layout: BaseLayout,
})
