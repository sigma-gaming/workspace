import { createWsEffect } from '@core/io-client'
import { createEvent, createStore, sample } from 'effector'
import { interval } from 'patronum'
import { gamesWs } from '../../shared/api/games-ws'

const pingFx = createWsEffect(gamesWs, 'ping')

const initialize = createEvent()
const reset = createEvent()

const $startTime = createStore<number>(-1)
const $ping = createStore<number>(-1)

const { tick } = interval({
  start: initialize,
  stop: reset,
  timeout: 5000,
  leading: true,
})

sample({
  clock: tick,
  target: pingFx,
})

sample({
  clock: pingFx,
  fn: () => performance.now(),
  target: $startTime,
})

sample({
  clock: pingFx.done,
  source: $startTime,
  fn: (startTime) => performance.now() - startTime,
  target: $ping,
})

gamesWs.on('connect', () => initialize())
gamesWs.on('disconnect', () => reset())

export const $$ping = {
  initialize,
  reset,
  $ping,
}
