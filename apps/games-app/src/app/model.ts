import { createEvent, sample } from 'effector'
import { createBrowserHistory } from 'history'
import { not } from 'patronum'
import { $$balance } from '../entities/balance'
import { $$commonEvents } from '../entities/common-events'
import { $$user } from '../entities/user'
import { router } from '../routing'

export const started = createEvent()

sample({
  clock: started,
  fn: () => createBrowserHistory(),
  target: router.setHistory,
})

sample({
  clock: started,
  filter: not($$user.$expired),
  target: [$$user.request, $$balance.request],
})

sample({
  clock: started,
  target: $$commonEvents.subscribe,
})

export const $$app = {
  started,
}
