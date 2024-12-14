import { logger } from '@core/logger'
import { CronJob } from 'cron'

type Job = {
  name: string
  instance: CronJob
}

export class CronJobRegistry {
  jobs: Job[] = []

  register(options: { name: string; job: CronJob }) {
    const { name, job } = options
    this.jobs.push({ name, instance: job })
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
