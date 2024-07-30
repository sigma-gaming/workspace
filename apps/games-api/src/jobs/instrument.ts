import * as Sentry from '@sentry/bun'
import { CronJob as OriginalCronJob, CronJobParams } from 'cron'

export function createCronJob(name: string, params: CronJobParams) {
  return Sentry.cron.instrumentCron(OriginalCronJob, 'cron').from(params)
}
