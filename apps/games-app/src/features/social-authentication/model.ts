import { createFactory } from '@withease/factories'
import { attach, createEffect, Event, sample } from 'effector'
import { delay } from 'patronum'
import { $$balance } from '../../entities/balance'
import { $$profile } from '../../entities/profile'
import { $$user } from '../../entities/user'
import { router } from '../../routing'
import { restartGamesApiSocketFx } from '../../shared/api/games'
import { $$notificationEvents } from '../notification-events'

interface FactoryParams {
  clock: Event<unknown>
  authenticate: () => Promise<{ returnPath: string }>
}

const factory = createFactory(({ clock, authenticate }: FactoryParams) => {
  const authenticateFx = createEffect(authenticate)

  const redirectFx = attach({
    source: router.$history,
    effect(history, returnPath: string) {
      history.replace(returnPath)
    },
  })

  sample({
    clock,
    target: authenticateFx,
  })

  sample({
    clock: authenticateFx.doneData,
    fn: () => false,
    target: $$user.$expired,
  })

  sample({
    clock: authenticateFx.doneData,
    target: [
      $$user.request,
      $$balance.request,
      $$profile.request,
      restartGamesApiSocketFx,
    ],
  })

  sample({
    clock: delay(authenticateFx.doneData, 1000),
    fn: ({ returnPath }) => returnPath,
    target: redirectFx,
  })
})

export const $$socialAuthentication = {
  factory,
}
