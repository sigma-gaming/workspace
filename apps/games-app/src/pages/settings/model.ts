import { createMutation, RemoteOperationParams } from '@farfetched/core'
import {
  AccountProvider,
  getFullName,
  ProfileValidation,
} from '@libs/games-model'
import { notifications } from '@mantine/notifications'
import { createEffect, createEvent, createStore, sample } from 'effector'
import { z } from 'zod'
import { $$user } from '../../entities/user'
import { gamesApi } from '../../shared/api/games'
import { createForm } from './form.ts'

const updateProfileMutation = createMutation({
  name: 'settings/setUsedProvider',
  handler: gamesApi.settings.updateProfile.mutate,
})

type UpdateProfilePayload = RemoteOperationParams<typeof updateProfileMutation>

const submitProfile = createEvent()
const changeUsedProvider = createEvent<AccountProvider>()
const changeName = createEvent<string>()
const changeUsername = createEvent<string>()

const $updatingProfile = updateProfileMutation.$pending

const $username = createStore('')
  .on(changeUsername, (_, username) => username)
  .on($$user.$profile, (_, profile) => profile?.username ?? '')

const $name = createStore('')
  .on(changeName, (_, name) => name)
  .on($$user.$profile, (_, profile) => profile?.name ?? '')

const $usedProvider = createStore<AccountProvider | null>(null)
  .on(changeUsedProvider, (_, provider) => provider)
  .on($$user.$profile, (_, profile) => {
    if (!profile) return null
    return profile.usedProvider as AccountProvider
  })

const $$profileForm = createForm({
  values: {
    name: $name,
    username: $username,
    provider: $usedProvider,
  },
  schema: z.object({
    name: ProfileValidation.NameSchema,
    username: ProfileValidation.UsernameSchema,
    provider: z.nativeEnum(AccountProvider),
  }),
  target: updateProfileMutation.start,
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
    username: $username,
    provider: $usedProvider,
  },
  filter: ({ provider }) => Boolean(provider),
  fn: ({ name, username, provider }) => {
    const payload: UpdateProfilePayload = {
      username: username ? username : null,
      provider: provider!,
    }

    if (name) {
      payload.name = name
    }

    return payload
  },
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

sample({
  clock: updateProfileMutation.finished.failure,
  fn: ({ error }) => {
    console.log(Object.assign({}, error))
    return null
  },
})

export const $$settingsPage = {
  $$profileForm,
  changeName,
  changeUsername,
  changeUsedProvider,
  submitProfile,
  $name,
  $username,
  $usedProvider,
  $updatingProfile,
}
