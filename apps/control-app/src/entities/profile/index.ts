import { Mutation, update } from '@farfetched/core'
import { createEvent, sample } from 'effector'
import { and } from 'patronum'
import { UserDetails } from '../../shared/api/control'
import { $$user } from '../user'

const refresh = createEvent()

function receiveUpdates<T>(
  mutation: Mutation<any, T, any>,
  selector: (data: T) => UserDetails,
) {
  update($$user.query, {
    on: mutation,
    by: {
      success: ({ query, mutation }) => {
        if (query && 'error' in query) return { error: query.error }

        const userDetails = selector(mutation.result)
        return { result: userDetails }
      },
    },
  })
}

const loaded = $$user.query.finished.success

const $userDetails = $$user.query.$data
const $loading = $$user.query.$pending
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
  clock: refresh,
  fn: () => true,
  target: $$user.refresh,
})

export const $$profile = {
  receiveUpdates,
  refresh,
  loaded,
  $loading,
  $loaded,
  $accounts,
  $userDetails,
  $name,
  $hasCustomName,
  $usedProvider,
}
