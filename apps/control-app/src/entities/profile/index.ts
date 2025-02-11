import { createQuery } from '@farfetched/core'
import { createEvent, sample } from 'effector'
import { and } from 'patronum'
import { controlApi } from '../../shared/api/control'
import { createApiEffect } from '../../shared/api/effects'

const request = createEvent()
const refresh = createEvent()

const userDetailsQuery = createQuery({
  name: 'profile/get',
  effect: createApiEffect('query', controlApi.me.getUserDetails.$get),
})

const loaded = userDetailsQuery.finished.success

const $userDetails = userDetailsQuery.$data
const $loading = userDetailsQuery.$pending
const $loaded = and($userDetails)

const $accounts = $userDetails.map((details) => details?.accounts ?? [])

const $name = $userDetails.map((details) => details?.profile.name ?? '')

const $usedProvider = $userDetails.map((details) => {
  if (!details) return null
  return details.profile.usedProvider
})

sample({
  clock: request,
  target: userDetailsQuery.start,
})

sample({
  clock: refresh,
  fn: () => true,
  target: [userDetailsQuery.$stale, userDetailsQuery.refresh],
})

export const $$profile = {
  request,
  refresh,
  loaded,
  $loading,
  $loaded,
  $accounts,
  $userDetails,
  $name,
  $usedProvider,
}
