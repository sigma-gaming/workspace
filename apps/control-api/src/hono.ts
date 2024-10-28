import { HonoUwsEnv } from '@core/server'
import { SessionSelect } from '@dbs/games-schema'
import { Hono } from 'hono'

export type ControlApiEnv = HonoUwsEnv & {
  Variables: {
    session: SessionSelect
  }
}

export function createRouter() {
  return new Hono<ControlApiEnv>()
}
