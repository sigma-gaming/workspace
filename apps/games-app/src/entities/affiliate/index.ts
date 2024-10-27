import { handleExceptions } from '@core/client'
import { createMutation } from '@farfetched/core'
import { createEvent, createStore, sample } from 'effector'
import { status } from 'patronum'
import { createApiEffect } from '../../shared/api/effects'
import { gamesApi } from '../../shared/api/games'

const request = createEvent()
const connect = createEvent()
const reset = createEvent()

const isConnectedFx = createApiEffect(
  'query',
  gamesApi.affiliate.isConnected.$get,
)

const connectMutation = createMutation({
  name: 'affiliate/connect',
  effect: createApiEffect('json', gamesApi.affiliate.connect.$post),
})

const $isConnected = createStore(false)
  .on(isConnectedFx.doneData, (_, { isConnected }) => isConnected)
  .on(connectMutation.finished.success, () => true)
  .reset(reset)

const $connecting = connectMutation.$pending
const $loading = isConnectedFx.pending

const $loaded = status(isConnectedFx).map((status) => status === 'done')

sample({
  clock: request,
  target: isConnectedFx,
})

sample({
  clock: connect,
  target: connectMutation.start,
})

handleExceptions(connectMutation)

export const $$affiliate = {
  request,
  connect,
  reset,
  $isConnected,
  $loading,
  $loaded,
  $connecting,
}
