import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify'
import { SessionService } from '../services/session'

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const session = await SessionService.getSession(req)
  return { req, res, session }
}

export type Context = Awaited<ReturnType<typeof createContext>>
