import { Mutation, Query } from '@farfetched/core'
import { createFactory } from '@withease/factories'
import { createEvent, createStore, sample } from 'effector'

export const averageRequestTimeFactory = createFactory(
  (operation: Mutation<any, any, any> | Query<any, any, any>) => {
    const updated = createEvent<{ requestCount: number; totalTime: number }>()

    const $requestCount = createStore(0)
    const $totalTime = createStore(0)
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
        totalTime: $totalTime,
        requestCount: $requestCount,
      },
      fn: ({ startMap, averageTime, totalTime, requestCount }, payload) => {
        const startedAt = startMap.map.get(payload.params)
        const finishedAt = performance.now()
        const requestTime = startedAt ? finishedAt - startedAt : averageTime

        return {
          totalTime: totalTime + requestTime,
          requestCount: requestCount + 1,
        }
      },
      target: updated,
    })

    sample({
      source: updated,
      fn: ({ totalTime }) => totalTime,
      target: $totalTime,
    })

    sample({
      source: updated,
      fn: ({ requestCount }) => requestCount,
      target: $requestCount,
    })

    sample({
      source: updated,
      fn: ({ totalTime, requestCount }) => {
        if (requestCount === 0) return 0
        const averageTime = totalTime / requestCount
        return averageTime
      },
      target: $averageTime,
    })

    return $averageTime
  },
)
