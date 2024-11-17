import { HonoUwsEnv } from '@core/server'
import { Hono } from 'hono'

export function createRouter() {
  return new Hono<HonoUwsEnv>()
}
