import { Hono } from 'hono'
import { depositRoute } from './deposit'
import { withdrawRoute } from './withdraw'

export const balanceRouter = new Hono()
  .route('/deposit', depositRoute)
  .route('/withdraw', withdrawRoute)
