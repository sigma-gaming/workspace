import { routes } from '../../../routing'
import { RouteRecord } from '../../../routing/types.ts'
import { DicesGamePageView } from './view.tsx'

export const DicesGameRoute: RouteRecord = {
  route: routes.dicesGame,
  view: DicesGamePageView,
}
