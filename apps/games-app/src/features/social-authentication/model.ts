import { NotificationData } from '@mantine/notifications'
import { createFactory } from '@withease/factories'
import { attach, createEffect, Event, sample } from 'effector'
import { delay } from 'patronum'
import { $$balance } from '../../entities/balance'
import { $$notifications } from '../../entities/notifications'
import { $$profile } from '../../entities/profile'
import { AuthFlow, clearMeta, getMeta } from '../../entities/provider'
import { $$user } from '../../entities/user'
import { router } from '../../routing'
import { gamesWs } from '../../shared/api/games-ws'

interface FactoryParams {
  clock: Event<unknown>
  authenticate: () => Promise<void>
}

const takeMetaFx = createEffect(() => {
  const meta = getMeta()
  clearMeta()
  return meta
})

const redirectFx = attach({
  source: router.$history,
  effect(history, returnPath: string) {
    history.replace(returnPath)
  },
})

const titleMap: Record<AuthFlow, string> = {
  'sign-in': 'Вход выполнен',
  'connect': 'Привязка выполнена',
}

const messageMap: Record<AuthFlow, string> = {
  'sign-in': 'Удачной игры!',
  'connect': 'Социальная сеть добавлена к аккаунту',
}

sample({
  source: takeMetaFx.doneData,
  filter: Boolean,
  fn: ({ flow }): NotificationData => ({
    color: 'green',
    title: titleMap[flow],
    message: messageMap[flow],
  }),
  target: $$notifications.show,
})

sample({
  source: takeMetaFx.doneData,
  filter: Boolean,
  fn: ({ returnUrl }) => returnUrl,
  target: redirectFx,
})

const factory = createFactory(({ clock, authenticate }: FactoryParams) => {
  const authenticateFx = createEffect(authenticate)

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
      createEffect(() => {
        gamesWs.disconnect()
        gamesWs.connect()
      }),
    ],
  })

  sample({
    clock: delay(authenticateFx.doneData, 1000),
    target: takeMetaFx,
  })
})

export const $$socialAuthentication = {
  factory,
}
