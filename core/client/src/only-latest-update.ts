import { createStore, Event, sample } from 'effector'

export function onlyLatestUpdate<U extends { time: number }>(
  received: Event<U>,
) {
  const $updateTime = createStore(0)

  const actualReceived: Event<U> = sample({
    clock: received,
    source: $updateTime,
    filter: (time, update) => update.time > time,
    fn: (_, update) => update,
  })

  sample({
    clock: actualReceived,
    fn: (update) => update.time,
    target: $updateTime,
  })

  return actualReceived
}
