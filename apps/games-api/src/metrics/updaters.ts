import { GameRecordSelect } from '@dbs/games-schema'
import { GameOutcome } from '@dbs/games-types'
import {
  betsAmountCounter,
  lossesAmountCounter,
  winsAmountCounter,
} from './metrics'

export function updateBetMetrics(record: GameRecordSelect) {
  const { game, bet, outcome, payout } = record
  betsAmountCounter.inc({ game }, bet)

  if (outcome === GameOutcome.Win) {
    winsAmountCounter.inc({ game }, payout)
  } else {
    lossesAmountCounter.inc({ game }, bet)
  }
}
