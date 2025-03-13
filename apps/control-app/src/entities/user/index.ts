import { createQuery } from '@farfetched/core'
import { createEvent, sample } from 'effector'
import { and } from 'patronum'
import { getUserDetails, UserRole } from '../../shared/api/control'
import { createApiEffect } from '../../shared/api/effects'

const request = createEvent()
const refresh = createEvent()
const failed = createEvent<Error>()

const query = createQuery({
  name: 'user/get',
  effect: createApiEffect(getUserDetails),
})

const loaded = query.finished.success

const $user = query.$data.map((details) => details?.user ?? null)
const $loading = query.$pending
const $loaded = and($user)
const $roles = $user.map((user) => user?.roles ?? [])
const $isAdmin = $roles.map((roles) => roles.includes(UserRole.Admin))

sample({
  clock: request,
  target: query.start,
})

sample({
  clock: refresh,
  fn: () => true,
  target: [query.$stale, query.refresh],
})

sample({
  source: query.finished.failure,
  fn: ({ error }) => error,
  target: failed,
})

export const $$user = {
  query,
  request,
  refresh,
  loaded,
  failed,
  $user,
  $loading,
  $loaded,
  $roles,
  $isAdmin,
}
