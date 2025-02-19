import { RouteException } from '@core/exceptions'
import { UserRole } from '@dbs/games-types'
import { createQuery } from '@farfetched/core'
import { createEvent, sample } from 'effector'
import { and } from 'patronum'
import { controlApi } from '../../shared/api/control'
import { createApiEffect } from '../../shared/api/effects'

const request = createEvent()
const refresh = createEvent()
const failed = createEvent<RouteException<unknown>>()

const userQuery = createQuery({
  name: 'user/get',
  effect: createApiEffect('query', controlApi.me.getUser.$get),
})

const loaded = userQuery.finished.success

const $user = userQuery.$data
const $loading = userQuery.$pending
const $loaded = and($user)

const $roles = $user.map((user) => user?.roles ?? [UserRole.User])
const $isAdmin = $roles.map((roles) => roles.includes(UserRole.Admin))
const $isModerator = $roles.map((roles) => roles.includes(UserRole.Moderator))
const $isSupport = $roles.map((roles) => roles.includes(UserRole.Support))

sample({
  clock: request,
  target: userQuery.start,
})

sample({
  clock: refresh,
  fn: () => true,
  target: [userQuery.$stale, userQuery.refresh],
})

sample({
  source: userQuery.finished.failure,
  fn: ({ error }) => error,
  target: failed,
})

export const $$user = {
  request,
  refresh,
  loaded,
  failed,
  $user,
  $loading,
  $loaded,
  $roles,
  $isAdmin,
  $isModerator,
  $isSupport,
}
