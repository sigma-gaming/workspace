import { onlyLatestUpdate } from '@core/client'
import { Mutation } from '@farfetched/core'
import { invoke } from '@withease/factories'
import { createEvent, createStore, sample } from 'effector'
import { previous, status } from 'patronum'
import {
  BalancePublic,
  BalancePublicUserUpdate,
  getUserBalance,
} from '../../shared/api/core'
import { $$coreWs, EventName } from '../../shared/api/core-ws'
import { createApiEffect } from '../../shared/api/effects'

const getBalanceFx = createApiEffect(getUserBalance)

const { receivedData: balanceUpdated } = invoke(() =>
  $$coreWs.subscriptionFactory(EventName.BalanceUpdated),
)

const request = createEvent()
const reset = createEvent()
const loaded = createEvent()
const updateReceived = createEvent<BalancePublicUserUpdate>()

const $balance = createStore<BalancePublic | null>(null).reset(reset)
const $status = status(getBalanceFx).reset(reset)

function receiveUpdates<T>(
  mutation: Mutation<any, T, any>,
  selector: (data: T) => BalancePublicUserUpdate,
) {
  sample({
    source: mutation.finished.success,
    fn: ({ result }) => selector(result),
    target: updateReceived,
  })
}

sample({
  clock: onlyLatestUpdate(updateReceived),
  source: $balance,
  filter: Boolean,
  fn: (balance, { data }) => ({
    ...balance,
    available: data.available,
  }),
  target: $balance,
})

const $loading = $status.map((status) => status === 'pending')
const $loaded = $status.map((status) => status === 'done')

const $available = $balance.map((balance) => balance?.available ?? 0)
const $previousAvailable = previous($available)

sample({
  clock: request,
  target: getBalanceFx,
})

sample({
  clock: getBalanceFx.done,
  target: loaded,
})

sample({
  source: getBalanceFx.doneData,
  target: $balance,
})

sample({
  clock: balanceUpdated,
  fn: (update) => update as BalancePublicUserUpdate,
  target: updateReceived,
})

export const $$balance = {
  receiveUpdates,
  request,
  loaded,
  reset,
  $balance,
  $loading,
  $loaded,
  $available,
  $previousAvailable,
}
