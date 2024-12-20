import { GlobalTaskKey, TaskStatus } from '@dbs/games-types'

export type GlobalTaskUpdate = {
  updateTime: number
  key: GlobalTaskKey
  status: TaskStatus
}
