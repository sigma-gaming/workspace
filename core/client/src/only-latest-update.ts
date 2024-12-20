import { createStore, Event, sample } from 'effector'

export function onlyLatestUpdate<U extends { updateTime: number }>(
  received: Event<U>,
) {
  const $updateTime = createStore(0)

  const actualReceived: Event<U> = sample({
    clock: received,
    source: $updateTime,
    filter: (time, update) => update.updateTime > time,
    fn: (_, update) => update,
  })

  sample({
    clock: actualReceived,
    fn: ({ updateTime }) => updateTime,
    target: $updateTime,
  })

  return actualReceived
}
