import { TransactionTable } from '@dbs/games-schema'
import { Game, TransactionType } from '@dbs/games-types'
import { budgetService, gamesCache, gamesDb } from '@games/services'
import {
  and,
  count,
  gt,
  inArray,
  isNotNull,
  lt,
  max,
  min,
  sql,
  sum,
} from 'drizzle-orm'
import { Gauge, Pushgateway, Registry } from 'prom-client'
import { v7 } from 'uuid'
import { env } from '../env'
import { createJob } from '../shared/jobs'

const MIN_ID = v7({ msecs: 0 })

export const sendAdvancedGamesMetricsJob = createJob({
  name: 'SendAdvancedGamesMetrics',
  cronTime: '*/5 * * * *', // every 5 minutes
  handler: async ({ logger }) => {
    const lock = await gamesCache.lastMetricsTransactionId.lock(10_000)

    async function updateLastId(id: string) {
      if (id === MIN_ID) {
        logger.info('skipping lastMetricsTransactionId update (maxId === 0)')
        return
      }

      await gamesCache.lastMetricsTransactionId.set(id)
      logger.info(`Updated lastMetricsTransactionId to ${id}`)
    }

    const lastProcessedTransactionId =
      await gamesCache.lastMetricsTransactionId.get()

    const budget = await budgetService.getAvailable()

    // Add some gap to avoid race condition
    const tenSecondsAgo = new Date(Date.now() - 10_000)

    const stats = await gamesDb
      .select({
        maxId: max(sql<string>`${TransactionTable.id}::text`).mapWith(String),
        game: TransactionTable.game,
        type: TransactionTable.type,
        maxAmount: max(TransactionTable.amount).mapWith(Number),
        minAmount: min(TransactionTable.amount).mapWith(Number),
        totalAmount: sum(TransactionTable.amount).mapWith(Number),
        count: count(TransactionTable.id),
      })
      .from(TransactionTable)
      .where(
        and(
          lastProcessedTransactionId !== null
            ? gt(TransactionTable.id, lastProcessedTransactionId)
            : undefined,
          isNotNull(TransactionTable.game),
          inArray(TransactionTable.type, [
            TransactionType.Win,
            TransactionType.Loss,
          ]),
          lt(TransactionTable.createdAt, tenSecondsAgo.toISOString()),
        ),
      )
      .groupBy(TransactionTable.game, TransactionTable.type)

    logger.debug(JSON.stringify(stats))

    const maxId = stats.reduce((acc, stat) => {
      return stat.maxId > acc ? stat.maxId : acc
    }, MIN_ID)

    if (!env.metrics.pushgatewayUrl) {
      await updateLastId(maxId)
      logger.info('Pushgateway URL is not set, skipping')
      return
    }

    const register = new Registry()

    register.setDefaultLabels({
      namespace: env.metrics.namespace,
    })

    const budgetGauge = new Gauge({
      name: 'games_available_budget',
      help: 'Available budget',
      registers: [register],
    })

    const maxAmountGauge = new Gauge({
      name: 'games_max_amount',
      help: 'Maximum amount of win/loss in the period',
      labelNames: ['type', 'game'],
      registers: [register],
    })

    const totalAmountGauge = new Gauge({
      name: 'games_total_amount',
      help: 'Total amount of win/loss in the period',
      labelNames: ['type', 'game'],
      registers: [register],
    })

    const gamesCountGauge = new Gauge({
      name: 'games_count',
      help: 'Number of games played in the period',
      labelNames: ['type', 'game'],
      registers: [register],
    })

    logger.info(`Budget: ${budget}`)
    budgetGauge.set(budget)

    for (const type of [TransactionType.Win, TransactionType.Loss]) {
      for (const game of Object.values(Game)) {
        maxAmountGauge.set({ type, game }, 0)
        totalAmountGauge.set({ type, game }, 0)
        gamesCountGauge.set({ type, game }, 0)
      }
    }

    for (const {
      game,
      type,
      maxAmount,
      minAmount,
      totalAmount,
      count,
    } of stats) {
      if (!game) continue
      logger.info(`Setting metrics for type ${type} and game ${game}`)
      logger.info(`Max amount: ${maxAmount}`)
      logger.info(`Total amount: ${totalAmount}`)
      logger.info(`Count: ${count}`)
      maxAmountGauge.set(
        { type, game },
        type === TransactionType.Win ? maxAmount : -minAmount,
      )
      totalAmountGauge.set({ type, game }, Math.abs(totalAmount))
      gamesCountGauge.set({ type, game }, count)
    }

    logger.info('Pushing metrics to pushgateway')

    const pushGateway = new Pushgateway(
      env.metrics.pushgatewayUrl,
      { timeout: 5_000 },
      register,
    )

    await pushGateway.push({
      jobName: 'send-advanced-games-metrics',
    })

    logger.info('Metrics pushed to pushgateway')

    await updateLastId(maxId)
    await lock.release()
  },
})
