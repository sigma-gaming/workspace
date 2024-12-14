import { subscriptionFactory } from '@core/io-client'
import { Mutation } from '@farfetched/core'
import { BalanceDetailed } from '@games/model'
import { invoke } from '@withease/factories'
import { createEvent, createStore, sample } from 'effector'
import { previous, status } from 'patronum'
import { createApiEffect } from '../../shared/api/effects'
import { gamesApi } from '../../shared/api/games'
import { gamesWs } from '../../shared/api/games-ws'

const getDetailedBalanceFx = createApiEffect(
  'query',
  gamesApi.me.getDetailedBalance.$get,
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

const $balance = createStore<BalanceDetailed | null>(null).reset(reset)
const $status = status(getDetailedBalanceFx).reset(reset)

function receiveUpdates<T>(
  mutation: Mutation<any, T, any>,
  selector: (data: T) => number,
) {
  sample({
    clock: mutation.finished.success,
    source: $balance,
    filter: Boolean,
    fn: (balance, { result }) => ({
      ...balance,
      available: selector(result),
    }),
    target: $balance,
  })
}

const $loading = $status.map((status) => status === 'pending')
const $loaded = $status.map((status) => status === 'done')

const $available = $balance.map((balance) => balance?.available ?? 0)
const $previousAvailable = previous($available)

sample({
  clock: request,
  target: getDetailedBalanceFx,
})

sample({
  clock: getDetailedBalanceFx.done,
  target: loaded,
})

sample({
  source: getDetailedBalanceFx.doneData,
  target: $balance,
})

sample({
  clock: balanceUpdated,
  target: $balance,
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
