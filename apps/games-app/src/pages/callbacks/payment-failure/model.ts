import { createEvent, createStore, sample } from 'effector'
import { interval } from 'patronum'
import { routes } from '../../../routing'

const initialize = createEvent()
const reset = createEvent()

const $secondsToRedirect = createStore(5)

const { tick } = interval({
  start: initialize,
  stop: reset,
  timeout: 1000,
})

sample({
  clock: tick,
  source: $secondsToRedirect,
  fn: (seconds) => seconds - 1,
  target: $secondsToRedirect,
})

sample({
  source: $secondsToRedirect,
  filter: (seconds) => seconds === 0,
  target: routes.games.open,
})

sample({
  clock: routes.paymentFailureCallback.opened,
  target: initialize,
})

export const $$paymentFailurePage = {
  initialize,
  reset,
  $secondsToRedirect,
}
