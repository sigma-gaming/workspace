import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'
import { UserUpdate } from './updates'

export type GlobalTaskStatusUpdate = UserUpdate<{
  key: GlobalTaskKey
  status: TaskStatus
}>
