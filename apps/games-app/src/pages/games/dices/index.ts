import { routes } from '../../../routing'
import { RouteRecord } from '../../../routing/types.ts'
import { DicesGamePageView } from './view.tsx'
import { createAuthenticatedRoute } from '../../../routing/authenticated-route.tsx'

export const DicesGameRoute = createAuthenticatedRoute({
  route: routes.dicesGame,
  view: DicesGamePageView,
})
