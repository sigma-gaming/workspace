import { Hono } from 'hono'
import { applyRoute } from './apply'

export const promocodesRouter = new Hono().route('/apply', applyRoute)
