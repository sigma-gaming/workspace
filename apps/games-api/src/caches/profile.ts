import { ProfileDetailed } from '@libs/games-model'
import { cache } from '../shared/redis'

export const detailedProfileCache = cache.entity<string, ProfileDetailed>({
  keygen: (token: string) => `detailed-profile:${token}`,
})
