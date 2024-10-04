import { createEvent, sample } from 'effector'
import { createBrowserHistory } from 'history'
import { $$profile } from '../entities/profile'
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
  filter: $$user.$loggedIn,
  target: [$$user.request, $$profile.request],
})

export const $$app = {
  started,
}
