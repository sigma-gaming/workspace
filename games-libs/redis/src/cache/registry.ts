import { createSingletonProxy } from '@core/di'
import {
  BudgetSelect,
  ChatMessageSelect,
  GameRecordSelect,
  NotificationSelect,
  TransactionSelect,
} from '@dbs/games-schema'
import { ProfileDetailed, Session } from '@games/model'
import { autoInjectable, inject, InjectionToken, singleton } from 'tsyringe'
import { GlobalJsonEntityService, KeyJsonEntityService } from './entity-json'
import { GlobalEntityListService, KeyEntityListService } from './entity-list'
import { GlobalNumberEntityService } from './entity-number'
import { GlobalStringEntityService } from './entity-string'

export const CacheVersionToken: InjectionToken<string> = Symbol('CacheVersion')

@singleton()
@autoInjectable()
export class CacheRegistry {
  budget: GlobalJsonEntityService<BudgetSelect>
  budgetAvailable: GlobalNumberEntityService
  budgetMaxLoss: GlobalNumberEntityService
  budgetUnwantedLoss: GlobalNumberEntityService
  budgetSyncedAt: GlobalStringEntityService
  detailedProfile: KeyJsonEntityService<ProfileDetailed>
  session: KeyJsonEntityService<Session>
  lastTransaction: KeyJsonEntityService<TransactionSelect>
  globalNotifications: GlobalJsonEntityService<NotificationSelect[]>
  personalNotifications: KeyJsonEntityService<NotificationSelect[]>
  lastChatMessages: GlobalEntityListService<ChatMessageSelect>
  lastWinHistory: GlobalEntityListService<GameRecordSelect>
  bigWinHistory: GlobalEntityListService<GameRecordSelect>
  userGameHistory: KeyEntityListService<GameRecordSelect>

  constructor(@inject(CacheVersionToken) version: string) {
    this.budget = new GlobalJsonEntityService<BudgetSelect>({
      key: `${version}:global:budget`,
      ttl: 60 * 15, // 15 minutes
    })

    this.budgetAvailable = new GlobalNumberEntityService({
      key: `global:budgetAvailable`,
      ttl: 60 * 60 * 24, // 1 day
    })

    this.budgetMaxLoss = new GlobalNumberEntityService({
      key: `global:budgetMaxLoss`,
      ttl: 60 * 60 * 24, // 1 day
    })

    this.budgetUnwantedLoss = new GlobalNumberEntityService({
      key: `global:budgetUnwantedLoss`,
      ttl: 60 * 60 * 24, // 1 day
    })

    this.budgetSyncedAt = new GlobalStringEntityService({
      key: `global:budgetSyncedAt`,
      ttl: 60 * 60 * 24, // 1 day
    })

    this.detailedProfile = new KeyJsonEntityService<ProfileDetailed>({
      keygen: (token: string) => `${version}:detailedProfile:${token}`,
    })

    this.session = new KeyJsonEntityService<Session>({
      keygen: (token: string) => `${version}:session:${token}`,
    })

    this.lastTransaction = new KeyJsonEntityService<TransactionSelect>({
      keygen: (userId: string) => `${version}:lastTransaction:${userId}`,
    })

    this.globalNotifications = new GlobalJsonEntityService<
      NotificationSelect[]
    >({
      key: `${version}:global:notifications`,
    })

    this.personalNotifications = new KeyJsonEntityService<NotificationSelect[]>(
      {
        keygen: (userId: string) => `${version}:notifications:${userId}`,
      },
    )

    this.lastChatMessages = new GlobalEntityListService<ChatMessageSelect>({
      key: `${version}:global:lastChatMessages`,
      max: 50,
      ttl: 60 * 60 * 24 * 1, // 1 day
    })

    this.lastWinHistory = new GlobalEntityListService<GameRecordSelect>({
      key: `${version}:global:lastWinHistory`,
      max: 10,
      ttl: 60 * 60 * 1, // 6 hours
    })

    this.bigWinHistory = new GlobalEntityListService<GameRecordSelect>({
      key: `${version}:global:bigWinHistory`,
      max: 10,
      ttl: 60 * 60 * 6, // 6 hours
    })

    this.userGameHistory = new KeyEntityListService<GameRecordSelect>({
      keygen: (userId: string) => `${version}:userGameHistory:${userId}`,
      max: 10,
      ttl: 60 * 15, // 15 minutes
    })
  }
}

export const gamesCaches = createSingletonProxy(CacheRegistry)
