import { fraudService } from '@games/services'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

export const whitelistUserRoute = new Hono().post(
  '/',
  zValidator(
    'json',
    z.object({
      userId: z.string(),
    }),
  ),
  async (ctx) => {
    const payload = ctx.req.valid('json')

    await fraudService.whitelistUser(payload.userId)

    return ctx.json({ status: 'success' })
  },
)
