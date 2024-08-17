import { HonoUwsEnv } from '@core/hono-uws'
import { UserSelect } from '@dbs/games-schema'
import { Session } from '@games/model'
import { Hono } from 'hono'

export type GamesApiEnv = HonoUwsEnv & {
  Variables: {
    session?: Session
    user?: UserSelect
  }
}

export function createRouter() {
  return new Hono<GamesApiEnv>()
}
