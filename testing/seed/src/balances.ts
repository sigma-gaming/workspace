import '../shared/setup'
import { logger } from '@core/logger'
import { UserTable } from '@dbs/games-schema'
import { TransactionType } from '@dbs/games-types'
import { balanceService, gamesDb } from '@games/services'
import { eq } from 'drizzle-orm'
import { batch } from '../shared/batch'

async function addBalances() {
  const users = await gamesDb.query.UserTable.findMany({
    where: eq(UserTable.virtual, true),
  })

  let done = 0

  await batch(50, users, async (user) => {
    try {
      const balance = await balanceService.getBalance(user.id)

      await gamesDb.transaction(async (tx) => {
        const transaction = await balanceService.createTransaction({
          tx,
          payload: {
            userId: user.id,
            type: TransactionType.Bonus,
            amount: 1_000_000_00,
          },
        })

        await balanceService.updateBalance({
          tx,
          balance,
          transaction,
        })

        logger.info(`Increased balance ${++done}`)
      })
    } catch (error) {
      logger.error(`Failed to increase balance for user ${user.id}: ${error}`)
    }
  })
}

async function run() {
  await addBalances()
  logger.info('Balances updated')
}

run().then(() => process.exit(0))
