import { createEvent, sample } from 'effector'
import { createBrowserHistory } from 'history'
import { router } from '../routing'

export const started = createEvent()

sample({
  clock: started,
  fn: () => createBrowserHistory(),
  target: router.setHistory,
})

export const $$app = {
  started,
}
