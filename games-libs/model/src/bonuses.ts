import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { Update } from './updates'

export type GlobalTaskUpdate = Update & {
  key: GlobalTaskKey
  status: TaskStatus
}
