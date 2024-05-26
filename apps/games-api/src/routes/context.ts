import { sessionService } from '@games/services'
import { loggerService } from '@libs/logger'
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const session = await sessionService.getSession(req)

  if (session.user) {
    const meta = req.meta ?? {}
    meta.userId = session.user.id
    req.meta = meta
  }

  const logger = loggerService.createRequestLogger(req)

  return { req, res, session, logger }
}

export type Context = Awaited<ReturnType<typeof createContext>>
