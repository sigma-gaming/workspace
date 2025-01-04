import { HonoUwsEnv } from '@core/server'
import { Hono } from 'hono'

export const app = new Hono<HonoUwsEnv>()

export type ApiType = typeof app
