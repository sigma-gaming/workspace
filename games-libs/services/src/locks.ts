import { createSingletonProxy } from '@core/di'
import { GlobalTaskKey } from '@dbs/games-types'
import { gamesCaches } from '@games/redis'
import { Lock } from '@sesamecare-oss/redlock'
import { singleton } from 'tsyringe-neo'

type LockController = {
  add: (lockPromise: Promise<Lock>) => Promise<void>
}

@singleton()
export class LocksService {
  balance(userId: string) {
    return gamesCaches.balance.lock(userId, 3000)
  }

  referrerBalance(referrerId: string, time = 3000) {
    return gamesCaches.referrerBalance.lock(referrerId, time)
  }

  promocode(code: string) {
    return gamesCaches.promocode.lock(code, 3000)
  }

  budget() {
    return gamesCaches.budget.lock(3000)
  }

  chat() {
    return gamesCaches.lastChatMessages.lock(3000)
  }

  sessionRefreshed(token: string) {
    return gamesCaches.sessionRefreshed.lock(token, 3000)
  }

  globalTaskStatus(taskKey: GlobalTaskKey, userId: string) {
    const cacheKey = `${userId}:${taskKey}`
    return gamesCaches.globalTaskStatus.lock(cacheKey, 3000)
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

export const locks = createSingletonProxy(LocksService)
