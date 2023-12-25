import { createInitializedRoute } from '@effectify/core/client'
import { createStore } from 'effector'
import { routes } from '../../routing'

const initializedRoute = createInitializedRoute(routes.test)

const $number = createStore(0)
  .on(initializedRoute.opened, (state) => state + 1)
  .on(initializedRoute.closed, (state) => state - 1)

export const $testPage = {
  $number,
}
