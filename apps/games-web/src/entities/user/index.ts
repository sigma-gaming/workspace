import { createQuery } from '@farfetched/core'
import { invoke } from '@withease/factories'
import { createEvent, sample } from 'effector'
import { createTRPCEffect } from '../../shared/api'
import { gamesApi } from '../../shared/api/games'

const getMeFx = invoke(() => createTRPCEffect(gamesApi.users.getMe.query))

const userQuery = createQuery({
  name: 'user/get',
  handler: getMeFx,
})

const request = createEvent()
const refresh = createEvent()
const loaded = userQuery.finished.success
const settled = userQuery.finished.finally

const $user = userQuery.$data
const $profile = $user.map((user) => user?.profile ?? null)
const $accounts = $user.map((user) => user?.accounts ?? [])

sample({
  clock: request,
  target: userQuery.start,
})

sample({
  clock: refresh,
  target: userQuery.refresh,
})

export const $$user = {
  request,
  refresh,
  loaded,
  settled,
  $user,
  $profile,
  $accounts,
}
