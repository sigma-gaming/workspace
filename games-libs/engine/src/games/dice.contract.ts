import { GameRecordSelect } from '@dbs/games-schema'

export type DicePayload = {
  bet: number
  sides: number[]
}

export type PlayDiceInput = {
  userId: string
  payload: DicePayload
}

export type PlayDiceOutput = {
  updatedBalance: number
  record: GameRecordSelect
}
