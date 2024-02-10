import { createSingletonProxy } from '@libs/di'
import {
  Budget,
  ChatMessage,
  Notification,
  Transaction,
} from '@games/db-schema'
import { ProfileDetailed, Session } from '@games/model'
import { inject, InjectionToken, singleton } from 'tsyringe'
import { CacheService, GlobalEntity, KeyEntity } from './service'

export const CacheVersionToken: InjectionToken<string> = Symbol('CacheVersion')

@singleton()
export class CacheRegistry {
  budget: GlobalEntity<Budget>
  detailedProfile: KeyEntity<string, ProfileDetailed>
  session: KeyEntity<string, Session>
  lastTransaction: KeyEntity<string, Transaction>
  globalNotifications: GlobalEntity<Notification[]>
  personalNotifications: KeyEntity<string, Notification[]>
  lastChatMessages: GlobalEntity<ChatMessage[]>

  constructor(
    private cacheService: CacheService,
    @inject(CacheVersionToken) version: string,
  ) {
    this.budget = this.cacheService.entity<void, Budget>({
      keygen: () => `${version}:global:budget`,
      options: {
        ttl: 60 * 60 * 24, // 1 day
      },
    })

    this.detailedProfile = this.cacheService.entity<string, ProfileDetailed>({
      keygen: (token: string) => `${version}:detailed-profile:${token}`,
    })

    this.session = this.cacheService.entity<string, Session>({
      keygen: (token: string) => `${version}:session:${token}`,
    })

    this.lastTransaction = this.cacheService.entity<string, Transaction>({
      keygen: (userId: string) => `${version}:last-transaction:${userId}`,
    })

    this.globalNotifications = this.cacheService.entity<void, Notification[]>({
      keygen: () => `${version}:global:notifications`,
    })

    this.personalNotifications = this.cacheService.entity<
      string,
      Notification[]
    >({
      keygen: (userId: string) => `${version}:notifications:${userId}`,
    })

    this.lastChatMessages = this.cacheService.entity<void, ChatMessage[]>({
      keygen: () => `${version}:global:last-chat-messages`,
    })
  }
}

export const gamesCaches = createSingletonProxy(CacheRegistry)
