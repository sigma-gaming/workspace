import { WsActionHandler } from '@core/io-client'
import {
  ChatMessageSelect,
  GameRecordSelect,
  NotificationSelect,
} from '@dbs/games-schema'
import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import {
  DicePayload,
  PincodePayload,
  PlayDiceOutput,
  PlayPincodeOutput,
} from '@games/engine'
import { BalanceDetailed } from '@games/model'
import { SignInPayload } from './actions/auth/contracts'
import {
  GlobalTasksClaimRewardOutput,
  GlobalTasksClaimRewardPayload,
  GlobalTasksCompleteOutput,
  GlobalTasksCompletePayload,
} from './actions/global-tasks/contracts'

export type ServerToClientEvents = {
  'chat/message': (message: ChatMessageSelect) => void
  'notification': (notification: NotificationSelect) => void
  'gameHistory/lastWins': (lastWins: GameRecordSelect[]) => void
  'gameHistory/bigWins': (bigWins: GameRecordSelect[]) => void
  'maintenance/started': () => void
  'balance/updated': (balance: BalanceDetailed) => void
  'global-tasks/status-updated': (payload: {
    taskKey: GlobalTaskKey
    status: TaskStatus
  }) => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type ClientToServerEvents = {
  'ping': WsActionHandler<void, 'pong'>
  'auth/sign-in': WsActionHandler<SignInPayload, void>
  'auth/logout': WsActionHandler<void, void>
  'games/pincode': WsActionHandler<PincodePayload, PlayPincodeOutput>
  'games/dice': WsActionHandler<DicePayload, PlayDiceOutput>
  'global-tasks/complete': WsActionHandler<
    GlobalTasksCompletePayload,
    GlobalTasksCompleteOutput
  >
  'global-tasks/claim-reward': WsActionHandler<
    GlobalTasksClaimRewardPayload,
    GlobalTasksClaimRewardOutput
  >
}
