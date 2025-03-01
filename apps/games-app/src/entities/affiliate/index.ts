import { $$notifications, handleExceptions } from '@core/client'
import { createMutation } from '@farfetched/core'
import { createEvent, createStore, sample } from 'effector'
import { status } from 'patronum'
import {
  getAffiliateIsConnected,
  postAffiliateConnect,
} from '../../shared/api/core'
import { createApiEffect } from '../../shared/api/effects'

const request = createEvent()
const connect = createEvent()
const reset = createEvent()

const isConnectedFx = createApiEffect(getAffiliateIsConnected)

const connectMutation = createMutation({
  name: 'affiliate/connect',
  effect: createApiEffect(postAffiliateConnect),
})

handleExceptions(connectMutation)

const $isConnected = createStore(false)
  .on(isConnectedFx.doneData, (_, isConnected) => isConnected)
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

sample({
  clock: connectMutation.finished.success,
  target: $$notifications.show.prepend(() => ({
    color: 'green',
    title: 'Поздравляем!',
    message: 'Вы успешно подключены к партнерской программе',
  })),
})

export const $$affiliate = {
  request,
  connect,
  reset,
  $isConnected,
  $loading,
  $loaded,
  $connecting,
}
