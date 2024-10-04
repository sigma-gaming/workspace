import { createEffect, createEvent, sample } from 'effector'
import { createBrowserHistory } from 'history'
import Cookies from 'js-cookie'
import { $$affiliate } from '../entities/affiliate'
import { $$audio } from '../entities/audio'
import { $$balance } from '../entities/balance'
import { $$profile } from '../entities/profile'
import { $$user } from '../entities/user'
import { $$maintenance } from '../features/maintenance'
import { $$notificationEvents } from '../features/notification-events'
import { router } from '../routing'
import { gamesWs } from '../shared/api/games-ws'
import { env } from '../shared/env'
import { $$chatWidget } from '../widgets/chat'

export const started = createEvent()

sample({
  clock: started,
  fn: () => createBrowserHistory(),
  target: router.setHistory,
})

sample({
  clock: started,
  target: [
    $$audio.initialize,
    $$notificationEvents.initialize,
    $$chatWidget.initialize,
    $$maintenance.startChecking,
  ],
})

const loggedInEvents = [
  $$user.request,
  $$profile.request,
  $$balance.request,
  $$affiliate.request,
]

sample({
  clock: started,
  filter: $$user.$loggedIn,
  target: loggedInEvents,
})

sample({
  clock: $$user.loggedIn,
  target: [
    ...loggedInEvents,
    createEffect(() => {
      gamesWs.disconnect()
      gamesWs.connect()
    }),
  ],
})

sample({
  clock: $$user.loggedOut,
  target: [$$balance.reset, $$profile.reset, $$affiliate.reset],
})

sample({
  clock: router.$query,
  fn: (query) => query.r,
  filter: Boolean,
  target: createEffect((code: string) => {
    Cookies.set('referralCampaign', code, {
      domain: env.domain,
      expires: 365,
    })
  }),
})

export const $$app = {
  started,
}
