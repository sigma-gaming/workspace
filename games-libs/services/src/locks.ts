import { createSingletonProxy } from '@core/di'
import { gamesCaches } from '@games/redis'
import { Lock } from '@sesamecare-oss/redlock'
import { singleton } from 'tsyringe-neo'

type LockController = {
  add: (lockPromise: Promise<Lock>) => Promise<void>
}

@singleton()
export class LocksService {
  transaction(userId: string) {
    return gamesCaches.lastTransaction.lock(userId, 3000)
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
