import { Hono } from 'hono'
import { whitelistUserRoute } from './whitelist-user'

export const fraudServiceRouter = new Hono().route(
  '/whitelistUser',
  whitelistUserRoute,
)
