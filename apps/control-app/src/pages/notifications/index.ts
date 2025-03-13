import { BaseLayout } from '../../layouts/base'
import { createPage, routes } from '../../routing/index.ts'
import { NotificationsPageView } from './view.tsx'

export const NotificationsPage = createPage({
  route: routes.notifications,
  view: NotificationsPageView,
  layout: BaseLayout,
})
