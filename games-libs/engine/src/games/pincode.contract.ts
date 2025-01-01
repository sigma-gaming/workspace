import { GameRecordSelect } from '@dbs/games-schema'
import { PincodeMode } from '@dbs/games-types'

export type PincodePayload = {
  bet: number
  mode: PincodeMode
}

export type PlayPincodeInput = {
  userId: string
  payload: PincodePayload
}

export type PlayPincodeOutput = {
  updatedBalance: number
  record: GameRecordSelect
}
