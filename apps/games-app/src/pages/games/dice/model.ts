import { BadRequestException } from '@core/exceptions'
import { createField, createForm } from '@core/forms'
import { createApiEffect } from '@core/hono-client'
import { createMutation } from '@farfetched/core'
import { Rive } from '@rive-app/react-canvas'
import { attach, createEvent, createStore, sample } from 'effector'
import { and, condition, delay, not } from 'patronum'
import { z } from 'zod'
import { $$balance } from '../../../entities/balance'
import { $$notifications } from '../../../entities/notifications'
import { $$user } from '../../../entities/user'
import { routes } from '../../../routing'
import { gamesApi } from '../../../shared/api/games'

const playGameMutation = createMutation({
  name: 'games/dice/play',
  effect: createApiEffect(gamesApi.games.playDice.$post),
})

$$balance.receiveUpdates(playGameMutation, (data) => data.closingBalance)

const betDoubled = createEvent()
const betHalved = createEvent()
const playPressed = createEvent()
const autoplayPressed = createEvent()
const startPlay = createEvent()
const autoplayToggled = createEvent()
const autoplayChanged = createEvent<boolean>()
const riveChanged = createEvent<Rive | null>()
const animationLoaded = createEvent()
const animationStarted = createEvent()
const animationFinished = createEvent()
const reset = createEvent()

const $playing = playGameMutation.$pending

const $autoplaying = createStore(false)
  .on(autoplayChanged, (_, autoplay) => autoplay)
  .reset(reset)

const $rive = createStore<Rive | null>(null).on(riveChanged, (_, rive) => rive)

const $animationLoaded = createStore(false)
  .on(animationLoaded, () => true)
  .reset(reset)

const $animationPlaying = createStore(false)
  .on(animationStarted, () => true)
  .reset(animationFinished)
  .reset(reset)

const playAnimationFx = attach({
  source: $rive,
  effect(rive, animation?: string) {
    if (!rive) return
    rive.play(animation)
  },
})

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

const showActionNotAllowed = $$notifications.show.prepend(() => ({
  title: 'Действие недоступно',
  message: 'Чтобы играть, войдите в аккаунт',
  color: 'red',
}))

condition({
  source: playPressed,
  if: $$user.$expired,
  then: showActionNotAllowed,
  else: startPlay,
})

condition({
  source: autoplayPressed,
  if: $$user.$expired,
  then: showActionNotAllowed,
  else: autoplayToggled,
})

condition({
  source: autoplayToggled,
  if: and(not($playing), not($autoplaying)),
  then: autoplayChanged.prepend(() => true),
  else: autoplayChanged.prepend(() => false),
})

sample({
  clock: startPlay,
  target: form.submit,
})

sample({
  clock: betDoubled,
  source: fields.bet.$value,
  fn: (bet) => Math.ceil(bet * 2 * 100) / 100,
  target: fields.bet.update,
})

sample({
  clock: betHalved,
  source: fields.bet.$value,
  fn: (bet) => {
    const next = Math.ceil((bet / 2) * 100) / 100
    return Math.max(next, 1)
  },
  target: fields.bet.update,
})

sample({
  clock: form.submitted,
  target: playGameMutation.start,
})

sample({
  clock: reset,
  target: form.reset,
})

sample({
  clock: $autoplaying.updates,
  filter: Boolean,
  target: startPlay,
})

sample({
  clock: playGameMutation.finished.success,
  source: $rive,
  filter: Boolean,
  fn: (_, { result }) => `Shake_${result.side}`,
  target: playAnimationFx,
})

sample({
  clock: delay(
    sample({
      clock: animationFinished,
      filter: $autoplaying,
    }),
    250,
  ),
  target: startPlay,
})

const receivedApiError = sample({
  clock: playGameMutation.finished.failure,
  fn: ({ error }) => error,
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

sample({
  clock: routes.diceGame.closed,
  target: reset,
})

export const $$dicePage = {
  fields,
  form,
  $playing,
  $autoplaying,
  $animationPlaying,
  $animationLoaded,
  playPressed,
  autoplayPressed,
  riveChanged,
  animationLoaded,
  animationStarted,
  animationFinished,
  betDoubled,
  betHalved,
}
