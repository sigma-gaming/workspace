import {
  BudgetSelect,
  ChatMessageSelect,
  NotificationSelect,
  TransactionSelect,
} from '@dbs/games-schema'
import { ProfileDetailed, Session } from '@games/model'
import { createSingletonProxy } from '@libs/di'
import { inject, InjectionToken, singleton } from 'tsyringe'
import { CacheService, GlobalEntity, KeyEntity } from './service'

export const CacheVersionToken: InjectionToken<string> = Symbol('CacheVersion')

@singleton()
export class CacheRegistry {
  budget: GlobalEntity<BudgetSelect>
  detailedProfile: KeyEntity<string, ProfileDetailed>
  session: KeyEntity<string, Session>
  lastTransaction: KeyEntity<string, TransactionSelect>
  globalNotifications: GlobalEntity<NotificationSelect[]>
  personalNotifications: KeyEntity<string, NotificationSelect[]>
  lastChatMessages: GlobalEntity<ChatMessageSelect[]>

  constructor(
    private cacheService: CacheService,
    @inject(CacheVersionToken) version: string,
  ) {
    this.budget = this.cacheService.entity<void, BudgetSelect>({
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

    this.lastTransaction = this.cacheService.entity<string, TransactionSelect>({
      keygen: (userId: string) => `${version}:last-transaction:${userId}`,
    })

    this.globalNotifications = this.cacheService.entity<
      void,
      NotificationSelect[]
    >({
      keygen: () => `${version}:global:notifications`,
    })

    this.personalNotifications = this.cacheService.entity<
      string,
      NotificationSelect[]
    >({
      keygen: (userId: string) => `${version}:notifications:${userId}`,
    })

    this.lastChatMessages = this.cacheService.entity<void, ChatMessageSelect[]>(
      {
        keygen: () => `${version}:global:last-chat-messages`,
        options: {
          ttl: 60 * 60 * 24 * 1, // 1 day
        },
      },
    )
  }
}

export const gamesCaches = createSingletonProxy(CacheRegistry)
