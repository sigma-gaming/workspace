import { createApiEffect } from '@core/client'
import { NotAuthenticatedException } from '@core/exceptions'
import { UserRole } from '@dbs/games-types'
import { createQuery } from '@farfetched/core'
import { createEffect, createEvent, createStore, sample } from 'effector'
import Cookies from 'js-cookie'
import { and, not } from 'patronum'
import { gamesApi } from '../../shared/api/games'
import { env } from '../../shared/env'

const request = createEvent()
const refresh = createEvent()
const logout = createEvent()

const clientLogoutFx = createEffect(() => {
  Cookies.remove('sessionExpiresAt', { domain: env.domain })
})

const userQuery = createQuery({
  name: 'user/get',
  effect: createApiEffect(gamesApi.me.getUser.$get),
})

const logoutMutation = createQuery({
  name: 'user/logout',
  effect: createApiEffect(gamesApi.auth.logout.$post),
})

const loaded = userQuery.finished.success

const $user = userQuery.$data
const $loading = userQuery.$pending
const $loaded = and($user)
const $loggingOut = logoutMutation.$pending

const $roles = $user.map((user) => user?.roles ?? [UserRole.User])
const $isAdmin = $roles.map((roles) => roles.includes(UserRole.Admin))
const $isModerator = $roles.map((roles) => roles.includes(UserRole.Moderator))
const $isSupport = $roles.map((roles) => roles.includes(UserRole.Support))

const expiresAt = Cookies.get('sessionExpiresAt') ?? null
const initialExpired = expiresAt === null || new Date() >= new Date(expiresAt)
const $expired = createStore(initialExpired)
const $loggedIn = not($expired)

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
  filter: ({ error }) => error instanceof NotAuthenticatedException,
  target: logout,
})

sample({
  clock: logout,
  fn: () => true,
  target: [clientLogoutFx, userQuery.reset, $expired, logoutMutation.start],
})

export const $$user = {
  request,
  refresh,
  logout,
  loaded,
  $user,
  $loading,
  $loaded,
  $expired,
  $loggedIn,
  $loggingOut,
  $roles,
  $isAdmin,
  $isModerator,
  $isSupport,
}
