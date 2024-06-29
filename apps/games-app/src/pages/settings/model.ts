import { AccountProvider } from '@dbs/games-schema'
import { createMutation } from '@farfetched/core'
import { getUserFullName, ProfileValidation } from '@games/model'
import { BadRequestException, ValidationException } from '@libs/exceptions'
import {
  createField,
  createForm,
  FormErrors,
  InferFormValues,
  normalizeFieldErrors,
} from '@libs/forms'
import { createApiEffect } from '@libs/hono-client'
import { sample } from 'effector'
import { z } from 'zod'
import { $$notifications } from '../../entities/notifications'
import { $$profile } from '../../entities/profile'
import { gamesApi } from '../../shared/api/games'

const updateProfileMutation = createMutation({
  name: 'settings/setUsedProvider',
  effect: createApiEffect(gamesApi.settings.updateProfile.$post),
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

const profileForm = createForm({
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

type ProfileFormValues = InferFormValues<typeof profileForm>
type ProfileFormErrors = FormErrors<ProfileFormValues>

sample({
  source: profileForm.submitted,
  target: updateProfileMutation.start,
})

sample({
  source: updateProfileMutation.finished.failure,
  fn: ({ error }): Partial<ProfileFormErrors> => {
    if (error instanceof BadRequestException) {
      const errors: Record<string, string[]> = {}
      const { path = ['root'], message } = error.payload
      errors[path.join('.')] = [message]
      return errors
    }

    if (error instanceof ValidationException) {
      const { fieldErrors } = error.payload
      return normalizeFieldErrors(fieldErrors)
    }

    return {}
  },
  target: profileForm.setErrors,
})

sample({
  source: $$profile.$profile,
  filter: Boolean,
  fn: (profile) => ({
    name: profile.name ?? '',
    username: profile.username ?? '',
    provider: profile.usedProvider as AccountProvider,
  }),
  target: profileForm.initialize,
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

export const $$settingsPage = {
  profileFields,
  profileForm,
  $updatingProfile,
}
