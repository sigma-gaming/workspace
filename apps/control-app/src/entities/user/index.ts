import { NotAuthenticatedException } from '@core/exceptions'
import { UserRole } from '@dbs/games-types'
import { createQuery } from '@farfetched/core'
import { createEffect, createEvent, sample } from 'effector'
import Cookies from 'js-cookie'
import { and } from 'patronum'
import { gamesApi } from '../../shared/api/games'
import { letsauthApi } from '../../shared/api/letsauth'
import { createProtectedApiEffect } from '../../shared/api/protected'
import { $$session } from '../../shared/api/session'
import { env } from '../../shared/env'

const request = createEvent()
const refresh = createEvent()
const logout = createEvent()

const clientLogoutFx = createEffect(() => {
  Cookies.remove('sessionExpiresAt', { domain: env.domain })
})

const userQuery = createQuery({
  name: 'user/get',
  effect: createProtectedApiEffect('query', gamesApi.me.getUser.$get),
})

const logoutMutation = createQuery({
  name: 'user/logout',
  effect: createProtectedApiEffect('json', letsauthApi.logout.$post),
})

const loaded = userQuery.finished.success

const $user = userQuery.$data
const $loading = userQuery.$pending
const $loaded = and($user)
const $loggingOut = logoutMutation.$pending
const $loggedIn = $$session.$sessionActive.map(Boolean)

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
  filter: ({ error }) => error instanceof NotAuthenticatedException,
  target: logout,
})

sample({
  clock: logout,
  fn: () => false,
  target: [
    clientLogoutFx,
    userQuery.reset,
    logoutMutation.start,
    $$session.clear,
  ],
})

export const $$user = {
  request,
  refresh,
  logout,
  loaded,
  $user,
  $loading,
  $loaded,
  $loggedIn,
  $loggingOut,
  $roles,
  $isAdmin,
  $isModerator,
  $isSupport,
}
