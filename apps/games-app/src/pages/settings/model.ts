import { createMutation } from '@farfetched/core'
import { BadRequestException, ValidationException } from '@libs/exceptions'
import {
  AccountProvider,
  getFullName,
  ProfileValidation,
} from '@libs/games-model'
import { notifications } from '@mantine/notifications'
import { TRPCClientError } from '@trpc/client'
import { createEffect, sample } from 'effector'
import { z } from 'zod'
import { $$user } from '../../entities/user'
import { gamesApi } from '../../shared/api/games'
import {
  createField,
  createForm,
  FormErrors,
  InferFormValues,
  normalizeFieldErrors,
} from './form.ts'

const updateProfileMutation = createMutation({
  name: 'settings/setUsedProvider',
  handler: gamesApi.settings.updateProfile.mutate,
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
    const isTRPCClientError = error instanceof TRPCClientError
    if (!isTRPCClientError) return {}

    if (error.data.error === 'BadRequestException') {
      const exception = new BadRequestException(error.data.payload)
      const errors: Record<string, string[]> = {}
      const { path = ['root'], message } = exception.payload
      errors[path.join('.')] = [message]
      return errors
    }

    if (error.data.error === 'ValidationException') {
      const exception = new ValidationException(error.data.payload)
      const { fieldErrors } = exception.payload
      return normalizeFieldErrors(fieldErrors)
    }

    return {}
  },
  target: profileForm.setErrors,
})

sample({
  source: $$user.$profile,
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
  source: $$user.$accounts,
  fn: (accounts, provider) => {
    const account = accounts.find((account) => account.provider === provider)

    return getFullName(
      account?.providerUserFirstName,
      account?.providerUserLastName,
    )
  },
  target: profileFields.name.update,
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
  profileFields,
  profileForm,
  $updatingProfile,
}
