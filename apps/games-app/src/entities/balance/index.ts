import { onlyLatestUpdate } from '@core/client'
import { subscriptionFactory } from '@core/io-client'
import { Mutation } from '@farfetched/core'
import { BalanceDetailed, BalanceUpdate } from '@games/model'
import { invoke } from '@withease/factories'
import { createEvent, createStore, sample } from 'effector'
import { previous, status } from 'patronum'
import { createApiEffect } from '../../shared/api/effects'
import { gamesApi } from '../../shared/api/games'
import { gamesWs } from '../../shared/api/games-ws'

const getBalanceFx = createApiEffect(
  'query',
  gamesApi.me.getBalance.$get,
)

const { receivedData: balanceUpdated } = invoke(() =>
  subscriptionFactory({
    ws: gamesWs,
    event: 'balance/updated',
  }),
)

const request = createEvent()
const reset = createEvent()
const loaded = createEvent()
const updateReceived = createEvent<BalanceUpdate>()

const $balance = createStore<BalanceDetailed | null>(null).reset(reset)
const $status = status(getBalanceFx).reset(reset)

function receiveUpdates<T>(
  mutation: Mutation<any, T, any>,
  selector: (data: T) => BalanceUpdate,
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
