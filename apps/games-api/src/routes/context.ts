import { sessionService } from '@games/services'
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const session = await sessionService.getSession(req)

  return { req, res, session }
}

export type Context = Awaited<ReturnType<typeof createContext>>
