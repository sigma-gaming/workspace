import { Hono } from 'hono'
import { createRoute } from './create'
import { generateRoute } from './generate'

export const promocodesRouter = new Hono()
  .route('/create', createRoute)
  .route('/generate', generateRoute)
