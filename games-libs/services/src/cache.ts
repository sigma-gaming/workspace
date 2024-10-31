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
  ProfileDetailed,
  ReferrerTransactionDetailed,
} from '@games/model'
import { GamesCacheOptionsToken } from '@games/options'
import {
  GlobalBooleanEntityService,
  GlobalEntityBaseService,
  GlobalEntityListService,
  GlobalJsonEntityService,
  GlobalNumberEntityService,
  KeyEntityBaseService,
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

  constructor() {
    const { version } = resolveOptions(GamesCacheOptionsToken)
    const { redis, redlock } = gamesRedis

    this.maintenance = new GlobalBooleanEntityService({
      redis,
      redlock,
      key: `global:maintenance`,
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
      keygen: (token: string) => `${version}:detailedProfile:${token}`,
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
  }

  get ready() {
    return gamesRedis.ready
  }

  async with<T>(options: {
    entity: KeyEntityBaseService<T>
    key: string
    fn: () => T | null | Promise<T | null>
  }): Promise<T | null>

  async with<T>(options: {
    entity: GlobalEntityBaseService<T>
    fn: () => T | null | Promise<T | null>
  }): Promise<T | null>

  async with<T>(options: {
    key?: string
    entity: GlobalEntityBaseService<T> | KeyEntityBaseService<T>
    fn: () => T | null | Promise<T | null>
  }): Promise<T | null> {
    const { entity, key, fn } = options

    if (!this.ready) {
      return fn()
    }

    let cached: T | null = null

    if (entity instanceof GlobalEntityBaseService) {
      cached = await entity.get()
    } else if (entity instanceof KeyEntityBaseService) {
      if (!key) throw new Error('Key is required')
      cached = await entity.get(key)
    }

    if (cached) {
      return cached
    }

    const result = await fn()

    if (result === null) {
      return null
    }

    if (entity instanceof GlobalEntityBaseService) {
      await entity.set(result)
    } else if (entity instanceof KeyEntityBaseService) {
      if (!key) throw new Error('Key is required')
      await entity.set(key, result)
    }

    return result
  }

  async withList<T>(options: {
    entity: KeyEntityListService<T>
    key: string
    fn: () => T[] | Promise<T[]>
  }): Promise<T[]>

  async withList<T>(options: {
    entity: GlobalEntityListService<T>
    fn: () => T[] | Promise<T[]>
  }): Promise<T[]>

  async withList<T>(options: {
    key?: string
    entity: GlobalEntityListService<T> | KeyEntityListService<T>
    fn: () => T[] | Promise<T[]>
  }): Promise<T[]> {
    const { entity, key, fn } = options

    if (!this.ready) {
      return fn()
    }

    let cached: T[] | null = null

    if (entity instanceof GlobalEntityListService) {
      cached = await entity.get()
    } else if (entity instanceof KeyEntityListService) {
      if (!key) throw new Error('Key is required')
      cached = await entity.get(key)
    }

    if (cached) {
      return cached
    }

    const result = await fn()

    if (entity instanceof GlobalEntityListService) {
      await entity.set(result)
    } else if (entity instanceof KeyEntityListService) {
      if (!key) throw new Error('Key is required')
      await entity.set(key, result)
    }

    return result
  }
}

export const gamesCache = createLazyInstance(GamesCacheRegistry)
