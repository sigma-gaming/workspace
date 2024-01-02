import { createQuery } from '@farfetched/core'
import { invoke } from '@withease/factories'
import { createEvent, sample } from 'effector'
import { and } from 'patronum'
import { createTRPCEffect } from '../../shared/api'
import { gamesApi } from '../../shared/api/games'
import { appStarted } from '../../shared/events.ts'

const balanceQuery = createQuery({
  name: 'balance/get',
  handler: invoke(() => createTRPCEffect(gamesApi.me.getDetailedBalance.query)),
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
