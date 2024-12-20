import { BadRequestException } from '@core/exceptions'
import { limitByIp } from '@core/server'
import { takeFirstOrThrow } from '@core/utils'
import { BalanceTable, ReferrerBalanceTable } from '@dbs/games-schema'
import { TransactionType } from '@dbs/games-types'
import { BalanceUpdate, UpdateMode } from '@games/model'
import {
  affiliateService,
  balanceService,
  gamesCache,
  gamesDb,
  gamesPubsubs,
  sessionService,
} from '@games/services'
import { eq } from 'drizzle-orm'
import { createRouter } from '../../app/router'

export const withdrawRoute = createRouter().post(
  '/',
  limitByIp({ limit: 3, windowMs: 15 * 60 * 1000 }),
  async (ctx) => {
    const { userId } = await sessionService.getHonoSession(ctx)

    const { updatedBalance, updatedReferrerBalance } =
      await gamesDb.transaction(async (tx) => {
        const [referrerBalance] = await tx
          .select()
          .from(ReferrerBalanceTable)
          .where(eq(ReferrerBalanceTable.referrerId, userId))
          .for('update')

        if (!referrerBalance) {
          throw new BadRequestException({
            message: 'Вы не подключены к партнерской программе',
          })
        }

        if (referrerBalance.available < 1) {
          throw new BadRequestException({
            message: 'У вас нет доступных средств для вывода',
          })
        }

        const balance = await tx
          .select()
          .from(BalanceTable)
          .where(eq(BalanceTable.userId, userId))
          .for('update')
          .then(takeFirstOrThrow)

        const transaction = await balanceService.createTransaction({
          tx,
          payload: {
            userId,
            type: TransactionType.Transfer,
            amount: referrerBalance.available,
          },
        })

        const updatedBalance = await balanceService.updateBalance({
          tx,
          balance,
          transaction,
        })

        await affiliateService.createReferrerWithdrawal({
          tx,
          referrerId: userId,
          amount: referrerBalance.available,
        })

        const updatedReferrerBalance =
          await affiliateService.updateReferrerBalance({
            tx,
            referrerId: userId,
            available: 0,
          })

        return {
          updatedBalance,
          updatedReferrerBalance,
        }
      })

    if (gamesCache.ready) {
      await gamesCache.balance.set(userId, updatedBalance)
      await gamesCache.referrerBalance.set(userId, updatedReferrerBalance)
    }

    const time = Date.now()

    const balance: BalanceUpdate = {
      time,
      mode: UpdateMode.Optimized,
      available: updatedBalance.available,
    }

    gamesPubsubs.balanceUpdated.publish({
      userId,
      update: balance,
    })

    return ctx.json({
      balance,
      referrerBalance: {
        time,
        available: updatedReferrerBalance.available,
      },
    })
  },
)
