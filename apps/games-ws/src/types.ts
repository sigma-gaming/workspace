import { WsActionHandler } from '@core/io-client'
import {
  ChatMessageSelect,
  GameRecordSelect,
  NotificationSelect,
} from '@dbs/games-schema'
import {
  DicePayload,
  PincodePayload,
  PlayDiceOutput,
  PlayPincodeOutput,
} from '@games/engine'
import { BalanceDetailed } from '@games/model'

export type ServerToClientEvents = {
  'chat/message': (message: ChatMessageSelect) => void
  'notification': (notification: NotificationSelect) => void
  'gameHistory/lastWins': (lastWins: GameRecordSelect[]) => void
  'gameHistory/bigWins': (bigWins: GameRecordSelect[]) => void
  'maintenance/started': () => void
  'balance/updated': (balance: BalanceDetailed) => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type ClientToServerEvents = {
  'ping': WsActionHandler<void, 'pong'>
  'games/pincode': WsActionHandler<PincodePayload, PlayPincodeOutput>
  'games/dice': WsActionHandler<DicePayload, PlayDiceOutput>
}
