import { BadRequestException } from '@core/exceptions'
import { createField, createForm } from '@core/forms'
import { createWsEffect } from '@core/io-client'
import { GameRecordSelect } from '@dbs/games-schema'
import { Game, GameOutcome } from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import { calculateDiceFullWinAmount } from '@games/model'
import type { Rive } from '@rive-app/react-canvas'
import { attach, combine, createEvent, createStore, sample } from 'effector'
import { and, combineEvents, condition, delay, not } from 'patronum'
import { z } from 'zod'
import { $$audio, Sound } from '../../entities/audio'
import { $$balance } from '../../entities/balance'
import { $$notifications } from '../../entities/notifications'
import { $$user } from '../../entities/user'
import { $$gameHistory } from '../../features/game-history'
import { routes } from '../../routing'
import { gamesWs } from '../../shared/api/games-ws'

const playGameMutation = createMutation({
  name: 'games/dice/play',
  effect: createWsEffect(gamesWs, 'games/dice'),
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
const startLoaded = createEvent()
const animationStarted = createEvent()
const animationFinished = createEvent()
const reset = createEvent()

const $playing = playGameMutation.$pending

const $autoplaying = createStore(false)
  .on(autoplayChanged, (_, autoplay) => autoplay)
  .reset(reset)

const $rive = createStore<Rive | null>(null).on(riveChanged, (_, rive) => rive)

const $started = createStore(false)
  .on(playGameMutation.finished.success, () => true)
  .reset(reset)

const $lastGame = createStore<GameRecordSelect | null>(null).reset(reset)

const animationsLoaded = combineEvents({
  events: [startLoaded, animationLoaded],
  reset,
})

const $animationLoaded = createStore(false)
  .on(animationsLoaded, () => true)
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
    persistInitialValue: true,
  }),
  sides: createField<string[]>({
    emptyValue: ['1'],
    persistKey: 'games/dice/sides',
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
    sides: z
      .array(z.string().transform(Number))
      .min(1, 'Выберите как минимум одну грань')
      .max(5, 'Выберите не более пяти граней'),
  }),
})

const $possibleWinAmount = combine(
  fields.bet.$value,
  fields.sides.$value.map((sides) => sides.map(Number)),
  (bet, sides) => calculateDiceFullWinAmount(Number(bet) * 100, sides) / 100,
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
  filter: and(not($playing), not($animationPlaying)),
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

const receivedGameSnapshot = receivedGameRecord.filterMap((record) => {
  if (record.snapshot.game !== Game.Dice) return
  return record.snapshot
})

sample({
  source: receivedGameRecord,
  target: $lastGame,
})

sample({
  source: receivedGameSnapshot,
  fn: ({ outputSide }) => `Shake_${outputSide}`,
  target: playAnimationFx,
})

sample({
  source: receivedGameSnapshot,
  target: $$audio.play.prepend(() => Sound.Dice),
})

sample({
  source: receivedGameRecord,
  target: $$gameHistory.appendMyGame,
})

sample({
  clock: animationFinished,
  source: $lastGame,
  filter: (record) => record?.outcome === GameOutcome.Win,
  target: $$audio.play.prepend(() => Sound.WinDefault),
})

sample({
  clock: delay(animationFinished, 250),
  filter: $autoplaying,
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
  $started,
  startLoaded,
  playPressed,
  autoplayPressed,
  riveChanged,
  animationLoaded,
  animationStarted,
  animationFinished,
  betDoubled,
  betHalved,
}
