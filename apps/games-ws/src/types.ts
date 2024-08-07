import { WsActionHandler } from '@core/io-client'
import {
  ChatMessageSelect,
  GameRecordSelect,
  NotificationSelect,
} from '@dbs/games-schema'
import { BalanceDetailed } from '@games/model'
import { GamesDiceInput, GamesDiceOutput } from './actions/games/dice'
import { GamesPincodeInput, GamesPincodeOutput } from './actions/games/pincode'

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
  'games/pincode': WsActionHandler<GamesPincodeInput, GamesPincodeOutput>
  'games/dice': WsActionHandler<GamesDiceInput, GamesDiceOutput>
}
