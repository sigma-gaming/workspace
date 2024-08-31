import { $$notifications, handleExceptions } from '@core/client'
import { createField, createForm } from '@core/forms'
import { createWsEffect } from '@core/io-client'
import { GameRecordSelect } from '@dbs/games-schema'
import { Game, GameOutcome } from '@dbs/games-types'
import { createMutation } from '@farfetched/core'
import {
  clampBet,
  gemFloat,
  gemInt,
  getPincodeCombination,
  PincodeMode,
} from '@games/model'
import { createEvent, createStore, sample } from 'effector'
import { and, condition, delay, not } from 'patronum'
import { z } from 'zod'
import { $$audio, Sound } from '../../entities/audio'
import { $$balance } from '../../entities/balance'
import { $$user } from '../../entities/user'
import { $$gameHistory } from '../../features/game-history'
import { $$ping } from '../../features/ping'
import { routes } from '../../routing'
import { gamesWs } from '../../shared/api/games-ws'

type WinInfo = {
  amount: number
  multiplier: number
}

const playGameMutation = createMutation({
  name: 'games/pincode/play',
  effect: createWsEffect(gamesWs, 'games/pincode'),
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
const highlightCombination = createEvent<string | null>()
const showWinInfo = createEvent<WinInfo | null>()

const animationFinished = createEvent()
const reset = createEvent()

const $playing = playGameMutation.$pending

const $autoplaying = createStore(false)
  .on(autoplayChanged, (_, autoplay) => autoplay)
  .reset(reset)

const $animationPlaying = createStore(false)
  .on(pincodeChanged, () => true)
  .on(delay(pincodeChanged, 500), () => false)
  .reset(reset)

const $activePincode = createStore<number>(-1)
  .on(pincodeChanged, (_, pincode) => pincode)
  .reset(reset)

const $highlightedCombination = createStore<string | null>(null)
  .on(highlightCombination, (_, combination) => combination)
  .reset(reset)

const $winInfo = createStore<WinInfo | null>(null)
  .on(showWinInfo, (_, winInfo) => winInfo)
  .reset(reset)

const $lastGame = createStore<GameRecordSelect | null>(null).reset(reset)

const fields = {
  bet: createField({
    emptyValue: 1,
    persistKey: 'games/pincode/bet',
    resetToPersisted: true,
  }),
  mode: createField<PincodeMode>({
    emptyValue: PincodeMode.Hardcore,
    persistKey: 'games/pincode/mode',
    resetToPersisted: true,
  }),
  stopOnBigWin: createField({
    emptyValue: false,
    persistKey: 'games/pincode/stopOnBigWin',
    resetToPersisted: true,
  }),
}

const MIN_BET = gemInt(1)
const MAX_BET = gemInt(5000)

export const form = createForm({
  fields,
  schema: z.object({
    bet: z
      .number()
      .min(MIN_BET, `Минимальная ставка - ${gemFloat(MIN_BET)} гем`)
      .max(MAX_BET, `Максимальная ставка - ${gemFloat(MAX_BET)} гемов`),
    mode: z.nativeEnum(PincodeMode),
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
  if: and(not($playing), not($autoplaying), not($animationPlaying)),
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

sample({
  source: receivedGameRecord,
  target: $lastGame,
})

sample({
  clock: animationFinished,
  source: $lastGame,
  filter: (record) => record?.outcome === GameOutcome.Win,
  fn: (record) => {
    // 100x - bet (1x)
    if (record!.multiplier >= 9900) {
      return Sound.WinBigDefault
    }

    return Sound.WinDefault
  },
  target: $$audio.play,
})

sample({
  clock: animationFinished,
  source: {
    lastGame: $lastGame,
    mode: fields.mode.$value,
  },
  filter: Boolean,
  fn: ({ lastGame, mode }) =>
    lastGame?.snapshot.game === Game.Pincode
      ? getPincodeCombination(mode, lastGame.snapshot.outputNumber)
      : null,
  target: highlightCombination,
})

sample({
  clock: animationFinished,
  source: $lastGame,
  filter: Boolean,
  fn: ({ outcome, bet, payout, multiplier }): WinInfo | null =>
    outcome === GameOutcome.Win
      ? { amount: bet + payout, multiplier: multiplier + 100 }
      : null,
  target: showWinInfo,
})

const receivedWin = sample({
  source: receivedGameRecord,
  filter: ({ outcome }) => outcome === GameOutcome.Win,
})

const receivedLoss = sample({
  source: receivedGameRecord,
  filter: ({ outcome }) => outcome === GameOutcome.Loss,
})

const receivedBigWin = sample({
  source: receivedGameRecord,
  filter: ({ multiplier }) => multiplier >= 10000 * 0.95,
})

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
  source: pincodeChanged,
  target: $$audio.play.prepend(() => Sound.Pincode),
})

const autoplayWin = sample({
  clock: receivedWin,
  filter: $autoplaying,
})

const autoplayLoss = sample({
  clock: receivedLoss,
  filter: $autoplaying,
})

const $autoplayWinDelay = $$ping.$ping.map((time) =>
  Math.max(1500 - time, 1250),
)

const $autoplayLossDelay = $$ping.$ping.map((time) =>
  Math.max(1000 - time, 750),
)

sample({
  clock: [
    delay(autoplayWin, $autoplayWinDelay),
    delay(autoplayLoss, $autoplayLossDelay),
  ],
  filter: $autoplaying,
  target: startPlay,
})

sample({
  clock: playGameMutation.finished.failure,
  fn: () => false,
  target: $autoplaying,
})

handleExceptions(playGameMutation, { form })

sample({
  clock: routes.pincodeGame.closed,
  target: reset,
})

export const $$pincodePage = {
  playPressed,
  autoplayPressed,
  animationFinished,
  betDoubled,
  betHalved,
  fields,
  form,
  $playing,
  $autoplaying,
  $animationPlaying,
  $activePincode,
  $highlightedCombination,
  $winInfo,
}
