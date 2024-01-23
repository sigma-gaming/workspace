import { BaseLayout } from '../../layouts/base'
import { createAuthenticatedPage, routes } from '../../routing'
import { SettingsPageView } from './view.tsx'

export const SettingsPage = createAuthenticatedPage({
  route: routes.settings,
  view: SettingsPageView,
  layout: BaseLayout,
})
