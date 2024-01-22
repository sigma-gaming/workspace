import { CronJob } from 'cron'

interface CronJobConfig {
  name: string
  instance: CronJob
}

export const CronJobs: CronJobConfig[] = []
