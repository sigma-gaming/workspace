import { createMutation } from '@farfetched/core'
import { AccountProvider, getFullName } from '@libs/games-model'
import { notifications } from '@mantine/notifications'
import { createEffect, createEvent, createStore, sample } from 'effector'
import { $$user } from '../../entities/user'
import { gamesApi } from '../../shared/api/games'

const updateProfileMutation = createMutation({
  name: 'settings/setUsedProvider',
  handler: gamesApi.settings.updateProfile.mutate,
})

const submitProfile = createEvent()
const changeUsedProvider = createEvent<AccountProvider>()
const changeName = createEvent<string>()

const $updatingProfile = updateProfileMutation.$pending

const $name = createStore('').on(changeName, (_, name) => name)

const $usedProvider = createStore<AccountProvider | null>(null).on(
  changeUsedProvider,
  (_, provider) => provider,
)

sample({
  clock: $$user.$profile,
  fn: (profile) => {
    if (!profile) return null
    return profile.usedProvider as AccountProvider
  },
  target: $usedProvider,
})

sample({
  clock: $$user.$profile,
  fn: (profile) => profile?.name ?? '',
  target: $name,
})

sample({
  clock: changeUsedProvider,
  source: $$user.$accounts,
  fn: (accounts, provider) => {
    const account = accounts.find((account) => account.provider === provider)

    return getFullName(
      account?.providerUserFirstName,
      account?.providerUserLastName,
    )
  },
  target: $name,
})

sample({
  clock: submitProfile,
  source: {
    name: $name,
    provider: $usedProvider,
  },
  filter: ({ provider }) => Boolean(provider),
  fn: ({ name, provider }) => ({ name, provider: provider! }),
  target: updateProfileMutation.start,
})

sample({
  clock: updateProfileMutation.finished.success,
  target: $$user.request,
})

sample({
  clock: updateProfileMutation.finished.success,
  target: createEffect(() => {
    notifications.show({
      title: 'Профиль обновлен',
      message: `Ты великолепен!`,
    })
  }),
})

export const $$settingsPage = {
  changeName,
  changeUsedProvider,
  submitProfile,
  $name,
  $usedProvider,
  $updatingProfile,
}
