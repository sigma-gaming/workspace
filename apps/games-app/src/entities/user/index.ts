import { createQuery } from '@farfetched/core'
import { NotAuthenticatedException } from '@libs/exceptions'
import { createApiEffect } from '@libs/hono-client'
import { createEffect, createEvent, createStore, sample } from 'effector'
import Cookies from 'js-cookie'
import { and } from 'patronum'
import { gamesApi, gamesApiSocket } from '../../shared/api/games'
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
const settled = userQuery.finished.finally

const $user = userQuery.$data
const $loading = userQuery.$pending
const $loaded = and($user)
const $loggingOut = logoutMutation.$pending

const expiresAt = Cookies.get('sessionExpiresAt') ?? null
const initialExpired = expiresAt === null || new Date() >= new Date(expiresAt)
const $expired = createStore(initialExpired)

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

sample({
  clock: logoutMutation.finished.success,
  target: createEffect(() => gamesApiSocket.reconnect()),
})

export const $$user = {
  request,
  refresh,
  logout,
  loaded,
  settled,
  $user,
  $loading,
  $loaded,
  $expired,
  $loggingOut,
}
