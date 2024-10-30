import { GlobalTaskKey } from '@dbs/games-types'
import { Lock } from '@sesamecare-oss/redlock'
import { gamesCache } from './cache'

type LockController = {
  add: (lockPromise: Promise<Lock>) => Promise<void>
}

export class LocksService {
  balance(userId: string) {
    return gamesCache.balance.lock(userId, 3000)
  }

  referrerBalance(referrerId: string, time = 3000) {
    return gamesCache.referrerBalance.lock(referrerId, time)
  }

  promocode(code: string) {
    return gamesCache.promocode.lock(code, 3000)
  }

  budget() {
    return gamesCache.budget.lock(3000)
  }

  chat() {
    return gamesCache.lastChatMessages.lock(3000)
  }

  globalTaskStatus(taskKey: GlobalTaskKey, userId: string) {
    const cacheKey = `${userId}:${taskKey}`
    return gamesCache.globalTaskStatus.lock(cacheKey, 3000)
  }

  async with<T>(
    lockPromises: Promise<Lock>[],
    callback: (controller: LockController) => T | Promise<T>,
  ) {
    const locks = await Promise.all(lockPromises)

    const controller: LockController = {
      async add(lockPromise: Promise<Lock>) {
        locks.push(await lockPromise)
      },
    }

    try {
      return await callback(controller)
    } finally {
      await Promise.all(locks.map((lock) => lock.release()))
    }
  }
}

export const locks = new LocksService()
