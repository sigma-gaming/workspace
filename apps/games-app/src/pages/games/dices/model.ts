import { createMutation } from '@farfetched/core'
import { BadRequestException, fromTrpc } from '@libs/exceptions'
import { createField, createForm } from '@libs/forms'
import { createEvent, createStore, sample } from 'effector'
import { condition } from 'patronum'
import { z } from 'zod'
import { $$balance } from '../../../entities/balance'
import { $$notifications } from '../../../entities/notifications'
import { $$user } from '../../../entities/user'
import { gamesApi } from '../../../shared/api/games'

const playGameMutation = createMutation({
  name: 'games/dices/play',
  handler: gamesApi.games.dices.mutate,
})

$$balance.receiveUpdates(playGameMutation, (data) => data.updatedBalance)

const playPressed = createEvent()
const autoplayPressed = createEvent()
const startPlay = createEvent()
const autoplayToggled = createEvent()

const $playing = playGameMutation.$pending
const $autoplaying = createStore(false).on(autoplayToggled, (state) => !state)

const fields = {
  bet: createField({
    emptyValue: 1,
  }),
  sides: createField<string[]>({
    emptyValue: ['1'],
  }),
}

export const form = createForm({
  fields,
  schema: z.object({
    bet: z
      .number()
      .min(1, 'Минимальная ставка - 1 рубль')
      .step(0.01, 'Ставка должна быть кратна 0.01')
      .transform((rubles) => Math.floor(rubles * 100)),
    sides: z
      .array(z.string().transform(Number))
      .min(1, 'Выберите как минимум одну грань')
      .max(6),
  }),
})

condition({
  source: sample({
    clock: playPressed,
    source: $$user.$expired,
  }),
  if: Boolean,
  then: $$notifications.show.prepend(() => ({
    title: 'Действие недоступно',
    message: 'Чтобы играть, войдите в аккаунт',
    color: 'red',
  })),
  else: startPlay,
})

condition({
  source: sample({
    clock: autoplayPressed,
    source: $$user.$expired,
  }),
  if: Boolean,
  then: $$notifications.show.prepend(() => ({
    title: 'Действие недоступно',
    message: 'Чтобы играть, войдите в аккаунт',
    color: 'red',
  })),
  else: autoplayToggled,
})

sample({
  clock: startPlay,
  target: form.submit,
})

sample({
  clock: form.submitted,
  target: playGameMutation.start,
})

sample({
  clock: $autoplaying.updates,
  filter: Boolean,
  target: startPlay,
})

sample({
  clock: playGameMutation.finished.success,
  filter: $autoplaying,
  target: startPlay,
})

const receivedApiError = sample({
  clock: playGameMutation.finished.failure,
  fn: ({ error }) => fromTrpc(error),
})

sample({
  clock: playGameMutation.finished.failure,
  fn: () => false,
  target: $autoplaying,
})

sample({
  source: receivedApiError,
  filter: (error): error is BadRequestException =>
    error instanceof BadRequestException,
  fn: ({ payload }: BadRequestException) => ({
    [payload.path?.join('.') ?? 'root']: [payload.message ?? ''],
  }),
  target: form.setErrors,
})

export const $$dicesPage = {
  fields,
  form,
  $playing,
  $autoplaying,
  playPressed,
  autoplayPressed,
}
