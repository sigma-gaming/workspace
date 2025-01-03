import { Hono } from 'hono'
import { AppEnv } from './base'

export function createRouter() {
  return new Hono<AppEnv>()
}
