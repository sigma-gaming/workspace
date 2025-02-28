import { createLazyInstance, resolveOptions } from '@core/di'
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
  CurrencyExchangeRates,
  ProfileDetailed,
  ReferrerTransactionDetailed,
} from '@games/model'
import { GamesCacheOptionsToken } from '@games/options'
import {
  GlobalBooleanEntityService,
  GlobalEntityListService,
  GlobalJsonEntityService,
  GlobalNumberEntityService,
  GlobalStringEntityService,
  KeyEntityListService,
  KeyJsonEntityService,
  KeyStringEntityService,
} from '@games/redis'
import { gamesRedis } from './redis'

type LastReferrerTransactions = {
  transactions: ReferrerTransactionDetailed[]
  totalAmount: number
}

export class GamesCacheRegistry {
  maintenance: GlobalBooleanEntityService
  backgroundJobsEnabled: GlobalBooleanEntityService
  budget: GlobalJsonEntityService<BudgetSelect>
  budgetAvailable: GlobalNumberEntityService
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
  currencyRates: GlobalJsonEntityService<CurrencyExchangeRates>
  lastMetricsTransactionId: GlobalStringEntityService

  constructor() {
    const { version } = resolveOptions(GamesCacheOptionsToken)
    const { redis, redlock } = gamesRedis

    this.maintenance = new GlobalBooleanEntityService({
      redis,
      redlock,
      key: `global:maintenance`,
    })

    this.backgroundJobsEnabled = new GlobalBooleanEntityService({
      redis,
      redlock,
      key: `global:backgroundJobsEnabled`,
    })

    this.budget = new GlobalJsonEntityService<BudgetSelect>({
      redis,
      redlock,
      key: `${version}:global:budget`,
      ttl: 60 * 15, // 15 minutes
    })

    this.budgetAvailable = new GlobalNumberEntityService({
      redis,
      redlock,
      key: `global:budgetAvailable`,
      ttl: 60 * 60 * 24, // 1 day
    })

    this.detailedProfile = new KeyJsonEntityService<ProfileDetailed>({
      redis,
      redlock,
      keygen: (userId: string) => `${version}:detailedProfile:${userId}`,
    })

    this.user = new KeyJsonEntityService<UserSelect>({
      redis,
      redlock,
      keygen: (userId: string) => `${version}:user:${userId}`,
    })

    this.session = new KeyJsonEntityService<SessionSelect>({
      redis,
      redlock,
      keygen: (sessionId: string) => `${version}:session:${sessionId}`,
      ttl: 60 * 60, // 1 hour
    })

    this.sessionCodeToSessionId = new KeyStringEntityService({
      redis,
      redlock,
      keygen: (code: string) => `sessionCodeToToken:${code}`,
      ttl: 60 * 5, // 5 minutes
    })

    this.balance = new KeyJsonEntityService<BalanceSelect>({
      redis,
      redlock,
      keygen: (userId: string) => `${version}:balance:${userId}`,
    })

    this.referrerBalance = new KeyJsonEntityService<ReferrerBalanceSelect>({
      redis,
      redlock,
      keygen: (userId: string) => `${version}:referrerBalance:${userId}`,
    })

    this.referrerSettings = new KeyJsonEntityService<ReferrerSettingsSelect>({
      redis,
      redlock,
      keygen: (referrerId: string) =>
        `${version}:referrerSettings:${referrerId}`,
    })

    this.lastReferrerTransactions =
      new KeyJsonEntityService<LastReferrerTransactions>({
        redis,
        redlock,
        keygen: (referrerId: string) =>
          `${version}:lastReferrerTransactions:${referrerId}`,
        ttl: 15 * 60, // 15 minutes
      })

    this.globalNotifications = new GlobalJsonEntityService<
      NotificationSelect[]
    >({
      redis,
      redlock,
      key: `${version}:global:notifications`,
    })

    this.personalNotifications = new KeyJsonEntityService<NotificationSelect[]>(
      {
        redis,
        redlock,
        keygen: (userId: string) => `${version}:notifications:${userId}`,
      },
    )

    this.lastChatMessages = new GlobalEntityListService<ChatMessageDetailed>({
      redis,
      redlock,
      key: `${version}:global:lastChatMessages`,
      max: 50,
      ttl: 60 * 60 * 24 * 1, // 1 day
    })

    this.lastWinHistory = new GlobalEntityListService<GameRecordSelect>({
      redis,
      redlock,
      key: `${version}:global:lastWinHistory`,
      max: 10,
      ttl: 60 * 60 * 1, // 6 hours
    })

    this.bigWinHistory = new GlobalEntityListService<GameRecordSelect>({
      redis,
      redlock,
      key: `${version}:global:bigWinHistory`,
      max: 10,
      ttl: 60 * 60 * 6, // 6 hours
    })

    this.userGameHistory = new KeyEntityListService<GameRecordSelect>({
      redis,
      redlock,
      keygen: (userId: string) => `${version}:userGameHistory:${userId}`,
      max: 10,
      ttl: 60 * 15, // 15 minutes
    })

    this.promocode = new KeyJsonEntityService<PromocodeSelect>({
      redis,
      redlock,
      keygen: (code: string) => `${version}:promocode:${code}`,
      ttl: 60 * 60, // 1 hour
    })

    this.globalTasks = new GlobalJsonEntityService<GlobalTaskSelect[]>({
      redis,
      redlock,
      key: `${version}:global:globalTasks`,
      ttl: 60 * 60, // 1 hour
    })

    this.globalTaskStatus = new KeyJsonEntityService<[TaskStatus, boolean]>({
      redis,
      redlock,
      keygen: (keyAndUserId: string) =>
        `${version}:globalTaskStatus:${keyAndUserId}`,
      ttl: 60 * 60, // 1 hour
    })

    this.currencyRates = new GlobalJsonEntityService<CurrencyExchangeRates>({
      redis,
      redlock,
      key: `global:currencyRates`,
      ttl: 60 * 15, // 15 minutes
    })

    this.lastMetricsTransactionId = new GlobalStringEntityService({
      redis,
      redlock,
      key: `global:lastMetricsTransactionId`,
      ttl: Infinity,
    })
  }

  get ready() {
    return gamesRedis.ready
  }
}

export const gamesCache = createLazyInstance(GamesCacheRegistry)
