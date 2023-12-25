import {
  allSettled,
  createEffect,
  createEvent,
  createStore,
  fork,
  sample,
  serialize,
  StoreWritable,
} from 'effector'
import { beforeEach, describe, expect, it, test } from 'vitest'

let isServer = false
let clockTriggered = false
let sourceTriggered = false

const collectValues = createEvent()
let values: Record<string, unknown> = {}

function createSSRStore<T>(key: string, defaultState: T): StoreWritable<T> {
  const internalDefaultState = key in values ? (values[key] as T) : defaultState
  console.log('internalDefaultState', internalDefaultState)
  const $store = createStore<T>(internalDefaultState)
  $store.defaultState = defaultState

  sample({
    clock: collectValues,
    source: $store,
    fn: (value) => {
      values[key] = value
      console.log('collectValues', values)
      return null
    },
  })

  return $store
}

function createModel() {
  const getFx = createEffect(() => {
    return Promise.resolve(1)
  })

  const $store = createSSRStore<number | null>('example', null).on(
    getFx.doneData,
    (_, payload) => payload,
  )

  sample({
    clock: $store,
    fn: () => {
      clockTriggered = true
      return null
    },
  })

  sample({
    source: $store,
    fn: () => {
      sourceTriggered = true
      return null
    },
  })

  return {
    getFx,
    $store,
  }
}

beforeEach(() => {
  isServer = false
  clockTriggered = false
  sourceTriggered = false
  values = {}
})

describe('initialized stores', () => {
  it('should not be triggered by sample', async () => {
    isServer = true
    const serverModel = createModel()
    const serverScope = fork()
    await allSettled(serverModel.getFx, { scope: serverScope })
    await allSettled(collectValues, { scope: serverScope })
    expect(serverScope.getState(serverModel.$store)).toBe(1)
    expect(clockTriggered).toBe(true)
    expect(sourceTriggered).toBe(true)

    isServer = false
    clockTriggered = false
    sourceTriggered = false
    const clientModel = createModel()
    const clientScope = fork({ values: serialize(serverScope) })
    expect(clientScope.getState(clientModel.$store)).toBe(1)
    expect(clockTriggered).toBe(false)
    expect(sourceTriggered).toBe(false)
  })

  test('something', async () => {
    const $store = createStore(0)

    sample({
      clock: $store,
      fn: () => {
        console.log('clock')
        return null
      },
    })

    sample({
      source: $store,
      fn: () => {
        console.log('source')
        return null
      },
    })

    console.log('before fork')
    const scope = fork()
    console.log('after fork')
    scope.getState($store)
    await Promise.resolve()
    console.log('after await')
  })
})
