import { createEffect, createEvent, restore, sample } from 'effector'
import { interval } from 'patronum'
import { createApiEffect } from '../../shared/api/effects'
import { gamesApi } from '../../shared/api/games'
import { gamesWs } from '../../shared/api/games-ws'

const pingFx = createApiEffect('query', gamesApi.games.ping.$get)

const measurePingFx = createEffect(async () => {
  const startTime = performance.now()
  await pingFx(0)
  return performance.now() - startTime
})

const initialize = createEvent()
const reset = createEvent()

const $ping = restore(measurePingFx, -1)

const { tick } = interval({
  start: initialize,
  stop: reset,
  timeout: 5000,
  leading: true,
})

sample({
  clock: tick,
  target: measurePingFx,
})

gamesWs.on('connect', () => initialize())
gamesWs.on('disconnect', () => reset())

export const $$ping = {
  initialize,
  reset,
  $ping,
}
