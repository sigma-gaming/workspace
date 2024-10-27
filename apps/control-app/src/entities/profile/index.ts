import { createQuery } from '@farfetched/core'
import { createEvent, sample } from 'effector'
import { and } from 'patronum'
import { controlApi } from '../../shared/api/control'
import { createApiEffect } from '../../shared/api/effects'

const request = createEvent()
const refresh = createEvent()

const profileQuery = createQuery({
  name: 'profile/get',
  effect: createApiEffect('query', controlApi.me.getDetailedProfile.$get),
})

const loaded = profileQuery.finished.success

const $profile = profileQuery.$data
const $loading = profileQuery.$pending
const $loaded = and($profile)

const $accounts = $profile.map((profile) => profile?.accounts ?? [])

const $name = $profile.map((profile) => profile?.name ?? '')

const $usedProvider = $profile.map((profile) => {
  if (!profile) return null
  return profile.usedProvider
})

sample({
  clock: request,
  target: profileQuery.start,
})

sample({
  clock: refresh,
  fn: () => true,
  target: [profileQuery.$stale, profileQuery.refresh],
})

export const $$profile = {
  request,
  refresh,
  loaded,
  $loading,
  $loaded,
  $accounts,
  $profile,
  $name,
  $usedProvider,
}
