import { Hono } from 'hono'
import { exchangeRoute } from './exchange'

export const accessRoute = new Hono().route('/exchange', exchangeRoute)
