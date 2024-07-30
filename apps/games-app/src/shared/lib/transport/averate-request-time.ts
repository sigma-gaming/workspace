import { Mutation, Query } from '@farfetched/core'
import { createFactory } from '@withease/factories'
import { createEvent, createStore, sample } from 'effector'

type Options = {
  operation: Query<any, any, any> | Mutation<any, any, any>
  last?: number
}

export const averageRequestTimeFactory = createFactory(
  ({ operation, last = 3 }: Options) => {
    const updated = createEvent<{ requestCount: number; lastTimes: number[] }>()

    const $requestCount = createStore(0)
    const $lastTimes = createStore<number[]>([])
    const $averageTime = createStore(0)

    const $startMap = createStore({ map: new WeakMap<object, number>() })

    sample({
      clock: operation.started,
      source: $startMap,
      fn: ({ map }, payload) => {
        map.set(payload.params, performance.now())
        return { map }
      },
      target: $startMap,
    })

    sample({
      clock: operation.finished.finally,
      source: {
        startMap: $startMap,
        averageTime: $averageTime,
        lastTimes: $lastTimes,
        requestCount: $requestCount,
      },
      fn: ({ startMap, averageTime, lastTimes, requestCount }, payload) => {
        const startedAt = startMap.map.get(payload.params)
        const finishedAt = performance.now()
        const requestTime = startedAt ? finishedAt - startedAt : averageTime

        return {
          lastTimes:
            last === 1
              ? [requestTime]
              : lastTimes.slice(1 - last).concat(requestTime),
          requestCount: Math.min(requestCount + 1, last),
        }
      },
      target: updated,
    })

    sample({
      source: updated,
      fn: ({ lastTimes }) => lastTimes,
      target: $lastTimes,
    })

    sample({
      source: updated,
      fn: ({ requestCount }) => requestCount,
      target: $requestCount,
    })

    sample({
      source: updated,
      fn: ({ lastTimes, requestCount }) => {
        if (requestCount === 0) return 0
        const totalTime = lastTimes.reduce((acc, time) => acc + time, 0)
        return totalTime / requestCount
      },
      target: $averageTime,
    })

    return $averageTime
  },
)
