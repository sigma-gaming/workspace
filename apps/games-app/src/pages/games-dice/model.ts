import { $$notifications, handleExceptions } from '@core/client'
import { createField, createForm } from '@core/forms'
import { createWsEffect } from '@core/io-client'
import { GameRecordSelect } from '@dbs/games-schema'
import { Game, GameOutcome } from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import { calculateDiceFullWinAmount, gemInt } from '@games/model'
import type { Rive } from '@rive-app/react-canvas'
import { attach, combine, createEvent, createStore, sample } from 'effector'
import { and, combineEvents, condition, delay, not } from 'patronum'
import { z } from 'zod'
import { $$audio, Sound } from '../../entities/audio'
import { $$balance } from '../../entities/balance'
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

const fields = {
  bet: createField({
    emptyValue: 100,
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
      .min(gemInt(1), 'Минимальная ставка - 1 гем')
      .max(gemInt(5000), 'Максимальная ставка - 5000 гемов'),
    sides: z
      .array(z.string().transform(Number))
      .min(1, 'Выберите как минимум одну грань')
      .max(5, 'Выберите не более пяти граней'),
  }),
})

const $possibleWinAmount = combine(
  fields.bet.$value,
  fields.sides.$value.map((sides) => sides.map(Number)),
  (bet, sides) => calculateDiceFullWinAmount(bet, sides),
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
  clock: form.failed,
  target: autoplayChanged.prepend(() => false),
})

sample({
  clock: betDoubled,
  source: { bet: fields.bet.$value, balance: $$balance.$available },
  fn: ({ bet, balance }) => Math.min(balance, bet * 2),
  target: fields.bet.update,
})

sample({
  clock: betHalved,
  source: fields.bet.$value,
  fn: (bet) => Math.max(1, bet / 2),
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
  message: (message) => ({
    color: 'red',
    title: 'Произошла ошибка',
    message,
  }),
  otherMessage: () => ({
    color: 'red',
    title: 'Что-то пошло не так',
    message: 'Попробуйте снова через пару минут',
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
