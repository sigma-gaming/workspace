import { createEvent, sample } from 'effector'
import { createBrowserHistory } from 'history'
import { not } from 'patronum'
import { $$balance } from '../entities/balance'
import { $$profile } from '../entities/profile'
import { $$user } from '../entities/user'
import { $$maintenance } from '../features/maintenance'
import { $$notificationEvents } from '../features/notification-events'
import { router } from '../routing'
import { $$chatWidget } from '../widgets/chat'

export const started = createEvent()

sample({
  clock: started,
  fn: () => createBrowserHistory(),
  target: router.setHistory,
})

sample({
  clock: started,
  filter: not($$user.$expired),
  target: [$$user.request, $$profile.request, $$balance.request],
})

sample({
  clock: started,
  target: [
    $$notificationEvents.initialize,
    $$chatWidget.initialize,
    $$maintenance.startChecking,
  ],
})

export const $$app = {
  started,
}
