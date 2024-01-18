import { createMutation, createQuery, update } from '@farfetched/core'
import { createEvent, sample } from 'effector'
import { and, not } from 'patronum'
import { gamesApi } from '../../shared/api/games'
import { appStarted } from '../../shared/events.ts'
import { $$user } from '../user'

const balanceQuery = createQuery({
  name: 'balance/get',
  handler: gamesApi.me.getDetailedBalance.query,
})

const depositMutation = createMutation({
  name: 'balance/deposit',
  handler: gamesApi.balance.deposit.mutate,
})

update(balanceQuery, {
  on: depositMutation,
  by: {
    success: ({ query, mutation }) => {
      if (query && 'error' in query) return { error: query.error }

      const available = mutation.result.updatedBalance
      return { result: { ...query?.result, available } }
    },
  },
})

const request = createEvent()
const refresh = createEvent()
const deposit = createEvent()
const loaded = balanceQuery.finished.success
const settled = balanceQuery.finished.finally

const $balance = balanceQuery.$data
const $loading = balanceQuery.$pending
const $loaded = and($balance)
const $depositing = depositMutation.$pending

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

sample({
  clock: deposit,
  target: depositMutation.start,
})

export const $$balance = {
  request,
  refresh,
  deposit,
  loaded,
  settled,
  $balance,
  $loading,
  $loaded,
  $available,
  $depositing,
}
