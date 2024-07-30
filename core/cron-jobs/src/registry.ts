import { createSingletonProxy } from '@core/di'
import { logger } from '@core/logger'
import { CronJob } from 'cron'
import { singleton } from 'tsyringe-neo'

type Job = {
  name: string
  instance: CronJob
}

@singleton()
export class CronJobRegistry {
  jobs: Job[] = []

  register(name: string, cronJob: CronJob) {
    this.jobs.push({ name, instance: cronJob })
    return this
  }

  start() {
    logger.info('Starting cron jobs..')
    for (const job of this.jobs) {
      job.instance.start()
      logger.info(`🚀 Cron job ${job.name} started`)
    }
    logger.info('Cron jobs started')
  }

  stop() {
    logger.info('Stopping cron jobs..')
    for (const job of this.jobs) {
      if (!job.instance.running) continue
      job.instance.stop()
      logger.info(`🚀 Cron job ${job.name} stopped`)
    }
    logger.info('Cron jobs stopped')
  }
}

export const cronJobRegistry = createSingletonProxy(CronJobRegistry)
