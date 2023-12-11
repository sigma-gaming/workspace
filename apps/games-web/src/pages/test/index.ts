import { routes } from '../../routing'
import { RouteRecord } from '../../routing/types.ts'
import { TestPage } from './page'

export const TestRoute: RouteRecord = {
  route: routes.test,
  view: TestPage,
}
