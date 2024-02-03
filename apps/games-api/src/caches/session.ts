import { Session } from '../services/session'
import { cache } from '../shared/cache'

export const sessionCache = cache.entity<string, Session>({
  keygen: (token: string) => `session:${token}`,
})
