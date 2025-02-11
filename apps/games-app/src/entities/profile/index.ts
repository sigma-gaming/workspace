import { createQuery, Mutation, update } from '@farfetched/core'
import { UserDetails } from '@games/model'
import { createEvent, sample } from 'effector'
import { and } from 'patronum'
import { createApiEffect } from '../../shared/api/effects'
import { gamesApi } from '../../shared/api/games'

const request = createEvent()
const refresh = createEvent()
const reset = createEvent()

const userDetailsQuery = createQuery({
  name: 'profile/get',
  effect: createApiEffect('query', gamesApi.me.getUserDetails.$get),
})

function receiveUpdates<T>(
  mutation: Mutation<any, T, any>,
  selector: (data: T) => UserDetails,
) {
  update(userDetailsQuery, {
    on: mutation,
    by: {
      success: ({ query, mutation }) => {
        if (query && 'error' in query) return { error: query.error }

        const userDetails = selector(mutation.result)
        return { result: userDetails, error: null }
      },
    },
  })
}

const loaded = userDetailsQuery.finished.success

const $userDetails = userDetailsQuery.$data
const $loading = userDetailsQuery.$pending
const $loaded = and($userDetails)

const $accounts = $userDetails.map((details) => details?.accounts ?? [])

const $name = $userDetails.map((details) => details?.profile.name ?? '')
const $hasCustomName = $userDetails.map(
  (details) => details?.profile.hasCustomName ?? false,
)

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

sample({
  clock: reset,
  target: userDetailsQuery.reset,
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
  $userDetails,
  $name,
  $hasCustomName,
  $usedProvider,
}
