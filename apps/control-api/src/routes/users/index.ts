import { Hono } from 'hono'
import { getInfoRoute } from './get-info'

export const usersRouter = new Hono().route('/getInfo', getInfoRoute)
