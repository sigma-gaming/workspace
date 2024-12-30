import { TransactionTable } from '@dbs/games-schema'
import { TransactionType } from '@dbs/games-types'
import { budgetService, gamesCache, gamesDb } from '@games/services'
import { and, count, gt, inArray, isNotNull, max, min, sum } from 'drizzle-orm'
import { Gauge, Pushgateway, Registry } from 'prom-client'
import { env } from '../env'
import { createJob } from '../shared/jobs'

export const sendAdvancedGamesMetricsJob = createJob({
  name: 'SendAdvancedGamesMetrics',
  cronTime: '*/5 * * * *', // every 5 minutes
  handler: async ({ logger }) => {
    const lock = await gamesCache.lastMetricsTransactionId.lock(10_000)

    async function updateLastId(id: number) {
      if (id === 0) {
        logger.info('skipping lastMetricsTransactionId update (maxId === 0)')
        return
      }

      await gamesCache.lastMetricsTransactionId.set(id)
      logger.info(`Updated lastMetricsTransactionId to ${id}`)
    }

    const lastProcessedTransactionId =
      await gamesCache.lastMetricsTransactionId.get()

    const budget = await budgetService.getAvailable()

    const stats = await gamesDb
      .select({
        maxId: max(TransactionTable.id).mapWith(Number),
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
        ),
      )
      .groupBy(TransactionTable.game, TransactionTable.type)

    logger.debug(stats)

    const maxId = stats.reduce((acc, stat) => {
      return Math.max(acc, stat.maxId)
    }, 0)

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

    for (const { game, type, maxAmount, totalAmount, count } of stats) {
      if (!game) continue
      logger.info(`Setting metrics for type ${type} and game ${game}`)
      logger.info(`Max amount: ${maxAmount}`)
      logger.info(`Total amount: ${totalAmount}`)
      logger.info(`Count: ${count}`)
      maxAmountGauge.set({ type, game }, maxAmount)
      totalAmountGauge.set({ type, game }, totalAmount)
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
