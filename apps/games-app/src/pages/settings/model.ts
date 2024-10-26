import { $$notifications, handleExceptions } from '@core/client'
import { createField, createForm } from '@core/forms'
import { AccountProvider } from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import { getUserFullName, ProfileValidation } from '@games/model'
import { createEvent, sample } from 'effector'
import { not } from 'patronum'
import { z } from 'zod'
import { $$profile } from '../../entities/profile'
import { routes } from '../../routing'
import { gamesApi } from '../../shared/api/games'
import { createProtectedApiEffect } from '../../shared/api/protected'

const reset = createEvent()

const updateProfileMutation = createMutation({
  name: 'settings/setUsedProvider',
  effect: createProtectedApiEffect(
    'json',
    gamesApi.settings.updateProfile.$post,
  ),
})

const $updatingProfile = updateProfileMutation.$pending

const profileFields = {
  name: createField({
    emptyValue: '',
  }),
  username: createField({
    emptyValue: '',
  }),
  provider: createField<AccountProvider | null>({
    emptyValue: null,
  }),
}

const form = createForm({
  fields: profileFields,
  schema: z.object({
    name: ProfileValidation.NameSchema.optional(),
    username: ProfileValidation.UsernameSchema.optional(),
    provider: z.nativeEnum(AccountProvider),
  }),
  cleanEmpty: {
    name: true,
    username: true,
  },
})

sample({
  source: form.submitted,
  target: updateProfileMutation.start,
})

handleExceptions(updateProfileMutation, { form })

sample({
  source: $$profile.$profile,
  filter: Boolean,
  fn: (profile) => ({
    name: profile.name ?? '',
    username: profile.username ?? '',
    provider: profile.usedProvider as AccountProvider,
  }),
  target: form.initialize,
})

sample({
  clock: profileFields.provider.update,
  source: $$profile.$accounts,
  fn: (accounts, provider) => {
    const account = accounts.find((account) => account.provider === provider)

    return getUserFullName(
      account?.providerUserFirstName,
      account?.providerUserLastName,
    )
  },
  filter: not($$profile.$hasCustomName),
  target: profileFields.name.update,
})

$$profile.receiveUpdates(
  updateProfileMutation,
  (output) => output.detailedProfile,
)

sample({
  clock: updateProfileMutation.finished.success,
  fn: () =>
    $$notifications.options({
      color: 'green',
      title: 'Профиль обновлен',
      message: `Ты великолепен!`,
    }),
  target: $$notifications.show,
})

sample({
  clock: reset,
  target: form.reset,
})

sample({
  clock: routes.settings.closed,
  target: reset,
})

export const $$settingsPage = {
  profileFields,
  form,
  $updatingProfile,
}
