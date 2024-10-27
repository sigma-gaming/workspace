import { Hono } from 'hono'
import { exchangeCodeRoute } from './exchange-code'

export const accessRoute = new Hono().route('/exchangeCode', exchangeCodeRoute)
