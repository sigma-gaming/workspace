import { BaseLayout } from '../../layouts/base'
import { createPage, routes } from '../../routing/index.ts'
import { MaintenancePageView } from './view.tsx'

export const MaintenancePage = createPage({
  route: routes.maintenance,
  view: MaintenancePageView,
  layout: BaseLayout,
})
