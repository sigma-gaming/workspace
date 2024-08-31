import { Hono } from 'hono'
import { tasksGlobalRouter } from './global'

export const tasksRouter = new Hono().route('/global', tasksGlobalRouter)
