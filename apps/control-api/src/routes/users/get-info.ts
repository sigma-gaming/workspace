import { gamesDb } from '@dbs/games-db'
import { UserSecurityTable } from '@dbs/games-schema'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'

export const getInfoRoute = new Hono().post(
  '/',
  zValidator(
    'json',
    z.object({
      userId: z.string(),
    }),
  ),
  async (ctx) => {
    const payload = ctx.req.valid('json')

    const security = await gamesDb.query.UserSecurityTable.findFirst({
      where: eq(UserSecurityTable.userId, payload.userId),
    })

    return ctx.json({ security })
  },
)
