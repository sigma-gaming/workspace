import { handleExceptions } from '@core/client'
import { createField, createForm } from '@core/forms'
import { GameRecordSelect } from '@dbs/games-schema'
import { Game, GameOutcome } from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import {
  calculateDiceFullWinAmount,
  clampBet,
  gemFloat,
  gemInt,
} from '@games/model'
import type { Rive } from '@rive-app/react-canvas'
import { attach, combine, createEvent, createStore, sample } from 'effector'
import { and, combineEvents, condition, delay, not } from 'patronum'
import { z } from 'zod'
import { $$audio, Sound } from '../../entities/audio'
import { $$balance } from '../../entities/balance'
import { $$gameHistory } from '../../features/game-history'
import { routes } from '../../routing'
import { createApiEffect } from '../../shared/api/effects'
import { gamesApi } from '../../shared/api/games'

const playGameMutation = createMutation({
  name: 'games/dice/play',
  effect: createApiEffect('json', gamesApi.games.playDice.$post),
})

$$balance.receiveUpdates(playGameMutation, ({ balance }) => balance)

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
const animationFailed = createEvent()
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

const $animationLoading = createStore(true)
  .on(animationsLoaded, () => false)
  .on(animationFailed, () => false)
  .reset(reset)

const $animationFailed = createStore(false)
  .on(animationFailed, () => true)
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

export const MIN_BET = gemInt(1)
export const MAX_BET = gemInt(5000)

const fields = {
  bet: createField({
    emptyValue: MIN_BET,
    persistKey: 'games/dice/bet',
    resetToPersisted: true,
  }),
  sides: createField<string[]>({
    emptyValue: ['1'],
    persistKey: 'games/dice/sides',
    resetToPersisted: true,
  }),
}

export const form = createForm({
  fields,
  schema: z.object({
    bet: z
      .number()
      .min(MIN_BET, `Минимальная ставка - ${gemFloat(MIN_BET)} гем`)
      .max(MAX_BET, `Максимальная ставка - ${gemFloat(MAX_BET)} гемов`),
    sides: z
      .array(z.string().transform(Number))
      .min(1, 'Выберите как минимум одну грань')
      .max(5, 'Выберите не более пяти граней'),
  }),
})

const $possibleWinAmount = combine(
  fields.bet.$value,
  fields.sides.$value.map((sides) => sides.map(Number)),
  (bet, sides) => calculateDiceFullWinAmount(bet, new Set(sides)),
)

sample({
  source: playPressed,
  target: startPlay,
})

sample({
  source: autoplayPressed,
  target: autoplayToggled,
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
  clock: form.failed,
  target: autoplayChanged.prepend(() => false),
})

sample({
  clock: betDoubled,
  source: { bet: fields.bet.$value, balance: $$balance.$available },
  fn: ({ bet, balance }) =>
    clampBet({
      bet: bet * 2,
      min: MIN_BET,
      max: MAX_BET,
      balance,
    }),
  target: fields.bet.update,
})

sample({
  clock: betHalved,
  source: { bet: fields.bet.$value, balance: $$balance.$available },
  fn: ({ bet, balance }) =>
    clampBet({
      bet: bet / 2,
      min: MIN_BET,
      max: MAX_BET,
      balance,
    }),
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

sample({
  clock: playGameMutation.finished.failure,
  fn: () => false,
  target: $autoplaying,
})

handleExceptions(playGameMutation, {
  form,
  notAuthenticatedMessage: () => ({
    color: 'red',
    title: 'Действие недоступно',
    message: 'Чтобы играть, войдите в аккаунт',
  }),
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
  $animationLoading,
  $animationFailed,
  $started,
  startLoaded,
  playPressed,
  autoplayPressed,
  riveChanged,
  animationLoaded,
  animationStarted,
  animationFinished,
  animationFailed,
  betDoubled,
  betHalved,
}
