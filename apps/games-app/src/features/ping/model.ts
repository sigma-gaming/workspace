import { createEffect, createEvent, createStore, sample } from 'effector'
import { interval } from 'patronum'
import { getGamesPing } from '../../shared/api/core'
import { createApiEffect } from '../../shared/api/effects'

const ALPHA = 0.25 // Smoothing factor
const OUTLIER_MULTIPLIER = 0.4
const SPIKE_LIMIT = 2

const pingFx = createApiEffect(getGamesPing)

const measurePingFx = createEffect(async () => {
  const startTime = performance.now()
  await pingFx()
  return performance.now() - startTime
})

const initialize = createEvent()
const reset = createEvent()

const $ping = createStore(-1).reset(reset)
const $minPing = createStore(-1).reset(reset)
const $spikeCount = createStore(0).reset(reset)

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

const updated = sample({
  clock: measurePingFx.doneData,
  source: {
    ping: $ping,
    minPing: $minPing,
    spikeCount: $spikeCount,
  },
  fn: ({ ping, minPing, spikeCount }, nextPing) => {
    if (ping === -1) {
      return { ping: nextPing, minPing: nextPing, spikeCount }
    }

    const upperThreshold = ping * OUTLIER_MULTIPLIER
    const lowerThreshold = minPing * OUTLIER_MULTIPLIER
    const diff = Math.abs(nextPing - ping)

    if (diff > Math.max(upperThreshold, lowerThreshold)) {
      spikeCount += 1
    } else {
      spikeCount = 0
    }

    if (spikeCount >= SPIKE_LIMIT) {
      ping = nextPing
      spikeCount = 0
    } else if (diff > Math.max(upperThreshold, lowerThreshold) * 2) {
      ping = nextPing
    } else {
      ping = nextPing * ALPHA + (1 - ALPHA) * ping
    }

    minPing = Math.min(minPing, nextPing)

    return { ping, minPing, spikeCount }
  },
})

sample({
  source: updated,
  fn: (updates) => updates.ping,
  target: $ping,
})

sample({
  source: updated,
  fn: (updates) => updates.spikeCount,
  target: $spikeCount,
})

export const $$ping = {
  initialize,
  reset,
  $ping,
}
