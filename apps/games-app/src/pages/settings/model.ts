import { createMutation } from '@farfetched/core'
import {
  AccountProvider,
  getFullName,
  ProfileValidation,
} from '@libs/games-model'
import { notifications } from '@mantine/notifications'
import { createEffect, createEvent, sample } from 'effector'
import { z } from 'zod'
import { $$user } from '../../entities/user'
import { gamesApi } from '../../shared/api/games'
import { createForm, defineInitialValues } from './form.ts'

const updateProfileMutation = createMutation({
  name: 'settings/setUsedProvider',
  handler: gamesApi.settings.updateProfile.mutate,
})

const $updatingProfile = updateProfileMutation.$pending

const initialValues = defineInitialValues<{
  name: string
  username: string
  provider: AccountProvider | null
}>({
  name: '',
  username: '',
  provider: null,
})

const $$profileForm = createForm({
  initialValues,
  schema: z.object({
    name: ProfileValidation.NameSchema,
    username: ProfileValidation.UsernameSchema,
    provider: z.nativeEnum(AccountProvider),
  }),
  mutation: updateProfileMutation,
})

sample({
  source: $$user.$profile,
  fn: (profile) => {
    if (!profile) return {}
    return { username: profile.username ?? '' }
  },
  target: $$profileForm.updateValues,
})

sample({
  source: $$user.$profile,
  fn: (profile) => {
    if (!profile) return {}
    return { provider: profile.usedProvider as AccountProvider }
  },
  target: $$profileForm.updateValues,
})

sample({
  source: $$user.$profile,
  fn: (profile) => {
    if (!profile) return {}
    return { name: profile.name ?? '' }
  },
  target: $$profileForm.updateValues,
})

sample({
  clock: $$profileForm.updateValues,
  source: $$user.$accounts,
  filter: (_, updates) => 'provider' in updates,
  fn: (accounts, updates) => {
    const account = accounts.find(
      (account) => account.provider === updates.provider,
    )

    return {
      name: getFullName(
        account?.providerUserFirstName,
        account?.providerUserLastName,
      ),
    }
  },
  target: $$profileForm.updateValues,
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
  $$profileForm,
  $updatingProfile,
}
