import { gamesPubsubs, maintenanceCache } from '@games/redis'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

export const updateMaintenanceRoute = new Hono().post(
  '/',
  zValidator(
    'json',
    z.object({
      value: z.boolean(),
    }),
  ),
  async (ctx) => {
    const payload = ctx.req.valid('json')
    await maintenanceCache.setMaintenanceMode(payload.value)

    if (payload.value) {
      await gamesPubsubs.maintenanceStarted.publish()
    }

    return ctx.json({ status: 'success', maintenanceMode: payload.value })
  },
)
