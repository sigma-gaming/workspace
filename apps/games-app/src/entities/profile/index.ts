import { createQuery, Mutation, update } from '@farfetched/core'
import { ProfileDetailed } from '@games/model'
import { createEvent, sample } from 'effector'
import { and } from 'patronum'
import { gamesApi } from '../../shared/api/games'
import { createProtectedApiEffect } from '../../shared/api/protected'

const request = createEvent()
const refresh = createEvent()
const reset = createEvent()

const profileQuery = createQuery({
  name: 'profile/get',
  effect: createProtectedApiEffect(
    'query',
    gamesApi.me.getDetailedProfile.$get,
  ),
})

function receiveUpdates<T>(
  mutation: Mutation<any, T, any>,
  selector: (data: T) => ProfileDetailed,
) {
  update(profileQuery, {
    on: mutation,
    by: {
      success: ({ query, mutation }) => {
        if (query && 'error' in query) return { error: query.error }

        const detailedProfile = selector(mutation.result)
        return { result: detailedProfile, error: null }
      },
    },
  })
}

const loaded = profileQuery.finished.success

const $profile = profileQuery.$data
const $loading = profileQuery.$pending
const $loaded = and($profile)

const $accounts = $profile.map((profile) => profile?.accounts ?? [])

const $name = $profile.map((profile) => profile?.name ?? '')
const $hasCustomName = $profile.map(
  (profile) => profile?.hasCustomName ?? false,
)

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

sample({
  clock: reset,
  target: profileQuery.reset,
})

export const $$profile = {
  receiveUpdates,
  request,
  refresh,
  reset,
  loaded,
  $loading,
  $loaded,
  $accounts,
  $profile,
  $name,
  $hasCustomName,
  $usedProvider,
}
