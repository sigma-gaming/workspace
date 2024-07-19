import { BadRequestException } from '@core/exceptions'
import { createField, createForm } from '@core/forms'
import { createApiEffect } from '@core/hono-client'
import { createMutation } from '@farfetched/core'
import { calculateDiceWinAmount } from '@games/model'
import type { Rive } from '@rive-app/react-canvas'
import { attach, combine, createEvent, createStore, sample } from 'effector'
import { and, condition, delay, not } from 'patronum'
import { z } from 'zod'
import { $$balance } from '../../entities/balance'
import { $$notifications } from '../../entities/notifications'
import { $$user } from '../../entities/user'
import { $$gameHistory } from '../../features/game-history'
import { routes } from '../../routing'
import { gamesApi } from '../../shared/api/games'

const playGameMutation = createMutation({
  name: 'games/dice/play',
  effect: createApiEffect(gamesApi.games.playDice.$post),
})

$$balance.receiveUpdates(playGameMutation, (data) => data.updatedBalance)

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
    emptyValue: '1',
    persistKey: 'games/dice/bet',
  }),
  sides: createField<string[]>({
    emptyValue: ['1'],
  }),
}

export const form = createForm({
  fields,
  schema: z.object({
    bet: z.coerce
      .number()
      .min(1, 'Минимальная ставка - 1 гем')
      .step(0.01, 'Ставка должна быть кратна 0.01')
      .transform((gems) => Math.floor(gems * 100)),
    sides: z
      .array(z.string().transform(Number))
      .min(1, 'Выберите как минимум одну грань')
      .max(5, 'Выберите не более пяти граней'),
  }),
})

const $possibleWinAmount = combine(
  fields.bet.$value,
  fields.sides.$value.map((sides) => sides.map(Number)),
  (bet, sides) => calculateDiceWinAmount(Number(bet) * 100, sides) / 100,
)

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
  source: { bet: fields.bet.$value, balance: $$balance.$available },
  fn: ({ bet, balance }) => {
    const doubled = Math.min(
      balance / 100,
      Math.ceil(Number(bet) * 2 * 100) / 100,
    )

    return String(doubled)
  },
  target: fields.bet.update,
})

sample({
  clock: betHalved,
  source: fields.bet.$value,
  fn: (bet) => {
    const halved = Math.max(1, Math.ceil((Number(bet) / 2) * 100) / 100)
    return String(halved)
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
  source: playGameMutation.finished.success,
  fn: ({ result }) => `Shake_${result.record.snapshot.outputSide}`,
  target: playAnimationFx,
})

sample({
  source: playGameMutation.finished.success,
  fn: ({ result }) => result.record,
  target: $$gameHistory.appendMyGame,
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
  $possibleWinAmount,
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
