import { createApiEffect } from '@core/client'
import { NotAuthenticatedException } from '@core/exceptions'
import { createQuery } from '@farfetched/core'
import { createEffect, createEvent, createStore, sample } from 'effector'
import Cookies from 'js-cookie'
import { and } from 'patronum'
import { gamesApi } from '../../shared/api/games'
import { gamesWs } from '../../shared/api/games-ws'
import { env } from '../../shared/env'

const request = createEvent()
const refresh = createEvent()
const logout = createEvent()
const loggedIn = createEvent()
const loggedOut = createEvent()

const clientLogoutFx = createEffect(() => {
  Cookies.remove('sessionExpiresAt', { domain: env.domain })
})

const userQuery = createQuery({
  name: 'user/get',
  effect: createApiEffect('query', gamesApi.me.getUser.$get),
})

const logoutMutation = createQuery({
  name: 'user/logout',
  effect: createApiEffect('json', gamesApi.auth.logout.$post),
})

const loaded = userQuery.finished.success

const $user = userQuery.$data
const $loading = userQuery.$pending
const $loaded = and($user)
const $loggingOut = logoutMutation.$pending

const expiresAt = Cookies.get('sessionExpiresAt') ?? null
const initialLoggedIn = expiresAt !== null && new Date() < new Date(expiresAt)
const $loggedIn = createStore(initialLoggedIn)

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
  target: [clientLogoutFx, userQuery.reset, logoutMutation.start, $loggedIn],
})

sample({
  clock: logoutMutation.finished.success,
  target: createEffect(() => {
    gamesWs.disconnect()
    gamesWs.connect()
  }),
})

sample({
  clock: logoutMutation.finished.success,
  target: loggedOut,
})

export const $$user = {
  request,
  refresh,
  logout,
  loggedIn,
  loggedOut,
  loaded,
  $user,
  $loading,
  $loaded,
  $loggedIn,
  $loggingOut,
}
