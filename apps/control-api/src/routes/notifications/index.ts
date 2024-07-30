import { Hono } from 'hono'
import { sendRoute } from './send-notification'

export const notificationsRouter = new Hono().route('/send', sendRoute)
