import { createQuery } from '@farfetched/core'
import { createEvent, sample } from 'effector'
import { gamesApi } from '../../shared/api/games'

const userQuery = createQuery({
  name: 'user/get',
  handler: gamesApi.users.getMe.query,
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
