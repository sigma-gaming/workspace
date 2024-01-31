import { createQuery, Mutation, update } from '@farfetched/core'
import { AccountProvider, ProfileDetailed } from '@libs/games-model'
import { createEvent, sample } from 'effector'
import { and } from 'patronum'
import { gamesApi } from '../../shared/api/games'

const request = createEvent()
const refresh = createEvent()

const profileQuery = createQuery({
  name: 'profile/get',
  handler: gamesApi.me.getDetailedProfile.query,
})

function receiveUpdates<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutation: Mutation<any, T, unknown>,
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
const settled = profileQuery.finished.finally

const $profile = profileQuery.$data
const $loading = profileQuery.$pending
const $loaded = and($profile)

const $accounts = $profile.map((profile) => profile?.accounts ?? [])

const $name = $profile.map((profile) => profile?.name ?? '')

const $usedProvider = $profile.map((profile) => {
  if (!profile) return null
  return profile.usedProvider as AccountProvider
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
  receiveUpdates,
  request,
  refresh,
  loaded,
  settled,
  $loading,
  $loaded,
  $accounts,
  $profile,
  $name,
  $usedProvider,
}
