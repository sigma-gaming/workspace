import {
  ChatMessageSelect,
  GameRecordSelect,
  NotificationSelect,
} from '@dbs/games-schema'
import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { BalanceDetailed } from '@games/model'

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
export type ClientToServerEvents = Record<string, never>
