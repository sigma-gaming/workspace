import { createSingletonProxy } from '@core/di'
import {
  ChatMessageSelect,
  NotificationSelect,
  TransactionSelect,
} from '@dbs/games-schema'
import { ProfileDetailed, Session } from '@games/model'
import { inject, InjectionToken, singleton } from 'tsyringe'
import { CacheService, GlobalEntity, KeyEntity } from './service'

export const CacheVersionToken: InjectionToken<string> = Symbol('CacheVersion')

@singleton()
export class CacheRegistry {
  budgetAvailable: GlobalEntity<number>
  budgetMaxLoss: GlobalEntity<number>
  budgetUnwantedLoss: GlobalEntity<number>
  budgetSyncedAt: GlobalEntity<string>
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
    this.budgetAvailable = this.cacheService.entity<void, number>({
      keygen: () => `global:budgetAvailable`,
      options: {
        ttl: 60 * 60 * 24, // 1 day
      },
    })

    this.budgetMaxLoss = this.cacheService.entity<void, number>({
      keygen: () => `global:budgetMaxLoss`,
      options: {
        ttl: 60 * 60 * 24, // 1 day
      },
    })

    this.budgetUnwantedLoss = this.cacheService.entity<void, number>({
      keygen: () => `global:budgetUnwantedLoss`,
      options: {
        ttl: 60 * 60 * 24, // 1 day
      },
    })

    this.budgetSyncedAt = this.cacheService.entity<void, string>({
      keygen: () => `global:budgetSyncedAt`,
      options: {
        ttl: 60 * 60 * 24, // 1 day
      },
    })

    this.detailedProfile = this.cacheService.entity<string, ProfileDetailed>({
      keygen: (token: string) => `${version}:detailedProfile:${token}`,
    })

    this.session = this.cacheService.entity<string, Session>({
      keygen: (token: string) => `${version}:session:${token}`,
    })

    this.lastTransaction = this.cacheService.entity<string, TransactionSelect>({
      keygen: (userId: string) => `${version}:lastTransaction:${userId}`,
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
        keygen: () => `${version}:global:lastChatMessages`,
        options: {
          ttl: 60 * 60 * 24 * 1, // 1 day
        },
      },
    )
  }
}

export const gamesCaches = createSingletonProxy(CacheRegistry)
