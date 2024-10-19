import { HonoUwsEnv } from '@core/server'
import { SessionVariant } from '@games/model'
import { Hono } from 'hono'

export type GamesApiEnv = HonoUwsEnv & {
  Variables: {
    sessionVariant: SessionVariant
  }
}

export function createRouter() {
  return new Hono<GamesApiEnv>()
}
