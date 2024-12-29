import { GameRecordSelect } from '@dbs/games-schema'
import { betsAmountCounter } from './metrics'

export function updateBetMetrics(record: GameRecordSelect) {
  const { game, bet } = record
  betsAmountCounter.inc({ game }, bet)
}
