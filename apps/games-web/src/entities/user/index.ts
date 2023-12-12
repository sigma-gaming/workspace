import { createQuery } from '@farfetched/core'
import { invoke } from '@withease/factories'
import { createEvent, sample } from 'effector'
import { createTRPCEffect } from '../../shared/api'
import { gamesApi } from '../../shared/api/games'

const userQuery = createQuery({
  name: 'user/get',
  handler: invoke(() => createTRPCEffect(gamesApi.users.getMe.query)),
})

const request = createEvent()
const loaded = userQuery.finished.success
const settled = userQuery.finished.finally

const $user = userQuery.$data
const $profile = $user.map((user) => user?.profile ?? null)
const $accounts = $user.map((user) => user?.accounts ?? [])

sample({
  clock: request,
  fn: () => ({}),
  target: userQuery.start,
})

export const $$user = {
  request,
  loaded,
  settled,
  $user,
  $profile,
  $accounts,
}
