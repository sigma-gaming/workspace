import { createInitializedRoute } from '@effectify/core/client'
import { sample } from 'effector'
import { $$user } from '../../entities/user'
import { routes } from '../../routing'

const clientRoute = createInitializedRoute(routes.home, {
  clientOnly: true,
})

sample({
  clock: clientRoute.opened,
  target: $$user.refresh,
})
