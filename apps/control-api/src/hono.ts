import { HonoUwsEnv } from '@core/server'
import { UserSelect } from '@dbs/games-schema'
import { Session } from '@games/model'
import { Hono } from 'hono'

export type ControlApiEnv = HonoUwsEnv & {
  Variables: {
    session: Session
    user: UserSelect
  }
}

export function createRouter() {
  return new Hono<ControlApiEnv>()
}
