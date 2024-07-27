import { BadRequestException } from '@core/exceptions'
import { createField, createForm } from '@core/forms'
import { createApiEffect } from '@core/hono-client'
import { Game } from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import { createEvent, createStore, sample } from 'effector'
import { and, condition, debug, delay, not } from 'patronum'
import { z } from 'zod'
import { $$balance } from '../../entities/balance'
import { $$notifications } from '../../entities/notifications'
import { $$user } from '../../entities/user'
import { $$gameHistory } from '../../features/game-history'
import { routes } from '../../routing'
import { gamesApi } from '../../shared/api/games'

export type PincodeMode = 'easy' | 'hardcore'

const playGameMutation = createMutation({
  name: 'games/pincode/play',
  effect: createApiEffect(gamesApi.games.playPincode.$post),
})

$$balance.receiveUpdates(playGameMutation, (data) => data.updatedBalance)

const betDoubled = createEvent()
const betHalved = createEvent()
const playPressed = createEvent()
const autoplayPressed = createEvent()
const startPlay = createEvent()
const autoplayToggled = createEvent()
const autoplayChanged = createEvent<boolean>()
const pincodeChanged = createEvent<number>()
const reset = createEvent()

const $playing = playGameMutation.$pending

const $autoplaying = createStore(false)
  .on(autoplayChanged, (_, autoplay) => autoplay)
  .reset(reset)

const $animationPlaying = createStore(false)
  .on(pincodeChanged, () => true)
  .on(delay(pincodeChanged, 500), () => false)
  .reset(reset)

const $activePincode = createStore<number>(0)
  .on(pincodeChanged, (_, pincode) => pincode)
  .reset(reset)

const fields = {
  bet: createField({
    emptyValue: '1',
    persistKey: 'games/pincode/bet',
    persistInitialValue: true,
  }),
  mode: createField<PincodeMode>({
    emptyValue: 'easy',
    persistKey: 'games/pincode/mode',
    persistInitialValue: true,
  }),
  stopOnBigWin: createField({
    emptyValue: false,
    persistKey: 'games/pincode/stopOnBigWin',
    persistInitialValue: true,
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
    mode: z.enum(['easy', 'hardcore']),
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

const receivedGameRecord = sample({
  source: playGameMutation.finished.success,
  fn: ({ result }) => result.record,
})

const receivedBigWin = sample({
  source: receivedGameRecord,
  filter: ({ multiplier }) => multiplier >= 10000 * 0.95,
})

debug(receivedBigWin)

sample({
  clock: receivedBigWin,
  filter: and($autoplaying, fields.stopOnBigWin.$value),
  target: autoplayChanged.prepend(() => false),
})

const receivedGameSnapshot = receivedGameRecord.filterMap((record) => {
  if (record.snapshot.game !== Game.Pincode) return
  return record.snapshot
})

sample({
  source: receivedGameSnapshot,
  fn: ({ outputNumber }) => outputNumber,
  target: pincodeChanged,
})

sample({
  source: receivedGameRecord,
  target: $$gameHistory.appendMyGame,
})

sample({
  clock: delay(
    sample({
      clock: pincodeChanged,
      filter: $autoplaying,
    }),
    1000, // 500ms animation + 500ms delay
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
  clock: routes.pincodeGame.closed,
  target: reset,
})

export const $$pincodePage = {
  playPressed,
  autoplayPressed,
  betDoubled,
  betHalved,
  fields,
  form,
  $playing,
  $autoplaying,
  $animationPlaying,
  $activePincode,
}
