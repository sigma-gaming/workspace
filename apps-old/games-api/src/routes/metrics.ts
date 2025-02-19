import { logger } from '@core/logger'
import { Hono } from 'hono'
import { registry } from '../metrics'

export const metricsRoute = new Hono().get('/', async (ctx) => {
  try {
    const metrics = await registry.metrics()
    ctx.header('Content-Type', registry.contentType)
    return ctx.text(metrics)
  } catch (error) {
    logger.error('Error generating metrics:', error)
    return ctx.text('Failed to generate metrics', 500)
  }
})
