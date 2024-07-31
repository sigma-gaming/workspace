import { createWsEffect } from '@core/io-client'
import { createEffect, createEvent, restore, sample } from 'effector'
import { interval } from 'patronum'
import { gamesWs } from '../../shared/api/games-ws'

const pingFx = createWsEffect(gamesWs, 'ping')

const measurePingFx = createEffect(async () => {
  const startTime = performance.now()
  await pingFx()
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
