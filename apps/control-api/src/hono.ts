import { HonoUwsEnv } from '@core/server'
import { Session } from '@games/model'
import { Hono } from 'hono'

export type ControlApiEnv = HonoUwsEnv & {
  Variables: {
    session: Session
  }
}

export function createRouter() {
  return new Hono<ControlApiEnv>()
}
