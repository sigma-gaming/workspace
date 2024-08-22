import { zValidator } from '@core/server'
import { gamesDb } from '@dbs/games-db'
import { UserSecurityTable } from '@dbs/games-schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createRouter } from '../../hono'

export const getInfoRoute = createRouter().post(
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
