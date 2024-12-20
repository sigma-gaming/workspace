import {
  ChatMessageSelect,
  GameRecordSelect,
  NotificationSelect,
} from '@dbs/games-schema'
import { BalanceUpdate, GlobalTaskUpdate } from '@games/model'

export type ServerToClientEvents = {
  'chat/message': (message: ChatMessageSelect) => void
  'notification': (notification: NotificationSelect) => void
  'gameHistory/lastWins': (lastWins: GameRecordSelect[]) => void
  'gameHistory/bigWins': (bigWins: GameRecordSelect[]) => void
  'maintenance/started': () => void
  'balance/updated': (update: BalanceUpdate) => void
  'global-tasks/updated': (update: GlobalTaskUpdate) => void
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type ClientToServerEvents = Record<string, never>
