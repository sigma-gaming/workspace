import { TransactionTable } from '@dbs/games-schema'
import { budgetService, gamesCache, gamesDb } from '@games/services'
import { and, count, gt, isNotNull, max, sum } from 'drizzle-orm'
import { Gauge, Pushgateway, Registry } from 'prom-client'
import { env } from '../env'
import { createJob } from '../shared/jobs'

export const sendTransactionsMetricsJob = createJob({
  name: 'SendTransactionsMetrics',
  enabled: Boolean(env.metrics.pushgatewayUrl),
  cronTime: '*/5 * * * *', // every 5 minutes
  handler: async ({ logger }) => {
    if (!env.metrics.pushgatewayUrl) {
      return
    }

    const lock = await gamesCache.lastMetricsTransactionId.lock(10_000)

    const lastProcessedTransactionId =
      await gamesCache.lastMetricsTransactionId.get()

    const budget = await budgetService.getAvailable()

    const stats = await gamesDb
      .select({
        maxId: max(TransactionTable.id).mapWith(Number),
        game: TransactionTable.game,
        maxAmount: max(TransactionTable.amount).mapWith(Number),
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
        ),
      )
      .groupBy(TransactionTable.game)

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
      name: 'games_max_transaction_amount',
      help: 'Maximum game transaction amount in the period',
      labelNames: ['game'],
      registers: [register],
    })

    const totalAmountGauge = new Gauge({
      name: 'games_total_transactions_amount',
      help: 'Total amount of game transactions in the period',
      labelNames: ['game'],
      registers: [register],
    })

    const transactionsCountGauge = new Gauge({
      name: 'games_transactions_count',
      help: 'Number of game transactions in the period',
      labelNames: ['game'],
      registers: [register],
    })

    logger.info(`Budget: ${budget}`)
    budgetGauge.set(budget)

    for (const { game, maxAmount, totalAmount, count } of stats) {
      if (!game) continue
      logger.info(`Setting metrics for game ${game}`)
      logger.info(`Max amount: ${maxAmount}`)
      logger.info(`Total amount: ${totalAmount}`)
      logger.info(`Count: ${count}`)
      maxAmountGauge.set({ game }, maxAmount)
      totalAmountGauge.set({ game }, totalAmount)
      transactionsCountGauge.set({ game }, count)
    }

    logger.info('Pushing metrics to pushgateway')

    const pushGateway = new Pushgateway(
      env.metrics.pushgatewayUrl,
      { timeout: 5_000 },
      register,
    )

    await pushGateway.pushAdd({
      jobName: 'send-transactions-metrics',
    })

    logger.info('Metrics pushed to pushgateway')

    const maxId = stats.reduce((acc, stat) => {
      return Math.max(acc, stat.maxId)
    }, 0)

    await gamesCache.lastMetricsTransactionId.set(maxId)

    await lock.release()
  },
})
