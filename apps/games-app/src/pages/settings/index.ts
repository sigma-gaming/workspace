import { routes } from '../../routing'
import { createAuthenticatedRoute } from '../../routing/authenticated-route.tsx'
import { RouteRecord } from '../../routing/types.ts'
import { SettingsPageView } from './view.tsx'

export const SettingsRoute: RouteRecord = createAuthenticatedRoute({
  route: routes.settings,
  view: SettingsPageView,
})
