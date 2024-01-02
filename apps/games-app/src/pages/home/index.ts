import { routes } from '../../routing'
import { RouteRecord } from '../../routing/types.ts'
import { HomePageView } from './view.tsx'

export const HomeRoute: RouteRecord = {
  route: routes.home,
  view: HomePageView,
}
