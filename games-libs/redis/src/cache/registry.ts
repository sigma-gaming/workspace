import { createSingletonProxy } from '@core/di'
import {
  BalanceSelect,
  BudgetSelect,
  GameRecordSelect,
  GlobalTaskSelect,
  NotificationSelect,
  PromocodeSelect,
  ReferrerBalanceSelect,
  ReferrerSettingsSelect,
  SessionSelect,
  UserSelect,
} from '@dbs/games-schema'
import { TaskStatus } from '@dbs/games-types'
import {
  ChatMessageDetailed,
  ProfileDetailed,
  ReferrerTransactionDetailed,
} from '@games/model'
import { autoInjectable, inject, InjectionToken, singleton } from 'tsyringe-neo'
import { GlobalJsonEntityService, KeyJsonEntityService } from './entity-json'
import { GlobalEntityListService, KeyEntityListService } from './entity-list'
import { GlobalNumberEntityService } from './entity-number'
import {
  GlobalStringEntityService,
  KeyStringEntityService,
} from './entity-string'

export const CacheVersionToken: InjectionToken<string> = Symbol('CacheVersion')

type LastReferrerTransactions = {
  transactions: ReferrerTransactionDetailed[]
  totalAmount: number
}

@singleton()
@autoInjectable()
export class CacheRegistry {
  budget: GlobalJsonEntityService<BudgetSelect>
  budgetAvailable: GlobalNumberEntityService
  budgetSyncedAt: GlobalStringEntityService
  detailedProfile: KeyJsonEntityService<ProfileDetailed>
  user: KeyJsonEntityService<UserSelect>
  session: KeyJsonEntityService<SessionSelect>
  sessionCodeToSessionId: KeyStringEntityService
  balance: KeyJsonEntityService<BalanceSelect>
  referrerBalance: KeyJsonEntityService<ReferrerBalanceSelect>
  referrerSettings: KeyJsonEntityService<ReferrerSettingsSelect>
  lastReferrerTransactions: KeyJsonEntityService<LastReferrerTransactions>
  globalNotifications: GlobalJsonEntityService<NotificationSelect[]>
  personalNotifications: KeyJsonEntityService<NotificationSelect[]>
  lastChatMessages: GlobalEntityListService<ChatMessageDetailed>
  lastWinHistory: GlobalEntityListService<GameRecordSelect>
  bigWinHistory: GlobalEntityListService<GameRecordSelect>
  userGameHistory: KeyEntityListService<GameRecordSelect>
  promocode: KeyJsonEntityService<PromocodeSelect>
  globalTasks: GlobalJsonEntityService<GlobalTaskSelect[]>
  globalTaskStatus: KeyJsonEntityService<[TaskStatus, boolean]>

  constructor(@inject(CacheVersionToken) version: string) {
    this.budget = new GlobalJsonEntityService<BudgetSelect>({
      key: `${version}:global:budget`,
      ttl: 60 * 15, // 15 minutes
    })

    this.budgetAvailable = new GlobalNumberEntityService({
      key: `global:budgetAvailable`,
      ttl: 60 * 60 * 24, // 1 day
    })

    this.budgetSyncedAt = new GlobalStringEntityService({
      key: `global:budgetSyncedAt`,
      ttl: 60 * 60 * 24, // 1 day
    })

    this.detailedProfile = new KeyJsonEntityService<ProfileDetailed>({
      keygen: (token: string) => `${version}:detailedProfile:${token}`,
    })

    this.user = new KeyJsonEntityService<UserSelect>({
      keygen: (userId: string) => `${version}:user:${userId}`,
    })

    this.session = new KeyJsonEntityService<SessionSelect>({
      keygen: (sessionId: string) => `${version}:session:${sessionId}`,
      ttl: 60 * 60, // 1 hour
    })

    this.sessionCodeToSessionId = new KeyStringEntityService({
      keygen: (code: string) => `sessionCodeToToken:${code}`,
      ttl: 60 * 5, // 5 minutes
    })

    this.balance = new KeyJsonEntityService<BalanceSelect>({
      keygen: (userId: string) => `${version}:balance:${userId}`,
    })

    this.referrerBalance = new KeyJsonEntityService<ReferrerBalanceSelect>({
      keygen: (userId: string) => `${version}:referrerBalance:${userId}`,
    })

    this.referrerSettings = new KeyJsonEntityService<ReferrerSettingsSelect>({
      keygen: (referrerId: string) =>
        `${version}:referrerSettings:${referrerId}`,
    })

    this.lastReferrerTransactions =
      new KeyJsonEntityService<LastReferrerTransactions>({
        keygen: (referrerId: string) =>
          `${version}:lastReferrerTransactions:${referrerId}`,
        ttl: 15 * 60, // 15 minutes
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

    this.lastChatMessages = new GlobalEntityListService<ChatMessageDetailed>({
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

    this.promocode = new KeyJsonEntityService<PromocodeSelect>({
      keygen: (code: string) => `${version}:promocode:${code}`,
      ttl: 60 * 60, // 1 hour
    })

    this.globalTasks = new GlobalJsonEntityService<GlobalTaskSelect[]>({
      key: `${version}:global:globalTasks`,
      ttl: 60 * 60, // 1 hour
    })

    this.globalTaskStatus = new KeyJsonEntityService<[TaskStatus, boolean]>({
      keygen: (keyAndUserId: string) =>
        `${version}:globalTaskStatus:${keyAndUserId}`,
      ttl: 60 * 60, // 1 hour
    })
  }
}

export const gamesCaches = createSingletonProxy(CacheRegistry)
