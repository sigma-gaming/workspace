import { createQuery } from '@farfetched/core'
import { AccountProvider } from '@libs/games-model'
import { createEvent, createStore, sample } from 'effector'
import Cookies from 'js-cookie'
import { and, not } from 'patronum'
import { gamesApi } from '../../shared/api/games'
import { appStarted } from '../../shared/events.ts'

const request = createEvent()
const refresh = createEvent()
const logout = createEvent()

const userQuery = createQuery({
  name: 'user/get',
  handler: gamesApi.me.getDetailedUser.query,
})

const logoutMutation = createQuery({
  name: 'user/logout',
  handler: gamesApi.auth.logout.mutate,
})

const loaded = userQuery.finished.success
const settled = userQuery.finished.finally

const $user = userQuery.$data
const $loading = userQuery.$pending
const $loaded = and($user)
const $loggingOut = logoutMutation.$pending

const expiresAt = new Date(Cookies.get('sessionExpiresAt') ?? Date.now())
const $expired = createStore(new Date() >= expiresAt)

const $accounts = $user.map((user) => user?.accounts ?? [])

const $profile = $user.map((user) => user?.profile ?? null)

const $name = $profile.map((profile) => profile?.name ?? '')

const $usedProvider = $profile.map((profile) => {
  if (!profile) return null
  return profile.usedProvider as AccountProvider
})

sample({
  clock: appStarted,
  filter: not($expired),
  target: request,
})

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
  clock: logout,
  target: logoutMutation.start,
})

sample({
  clock: logoutMutation.finished.success,
  fn: () => true,
  target: [userQuery.reset, $expired],
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
  $accounts,
  $expired,
  $loggingOut,
  $profile,
  $name,
  $usedProvider,
}
