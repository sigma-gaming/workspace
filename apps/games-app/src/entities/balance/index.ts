import { createQuery } from '@farfetched/core'
import { createEvent, sample } from 'effector'
import { and, not } from 'patronum'
import { gamesApi } from '../../shared/api/games'
import { appStarted } from '../../shared/events.ts'
import { $$user } from '../user'

const balanceQuery = createQuery({
  name: 'balance/get',
  handler: gamesApi.me.getDetailedBalance.query,
})

const request = createEvent()
const refresh = createEvent()
const logout = createEvent()
const loaded = balanceQuery.finished.success
const settled = balanceQuery.finished.finally

const $balance = balanceQuery.$data
const $loading = balanceQuery.$pending
const $loaded = and($balance)

const $available = $balance.map((balance) => balance?.available ?? 0)

sample({
  clock: appStarted,
  filter: not($$user.$expired),
  target: request,
})

sample({
  clock: request,
  target: balanceQuery.start,
})

sample({
  clock: refresh,
  fn: () => true,
  target: [balanceQuery.$stale, balanceQuery.refresh],
})

export const $$balance = {
  request,
  refresh,
  logout,
  loaded,
  settled,
  $balance,
  $loading,
  $loaded,
  $available,
}
