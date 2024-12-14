import { affiliateService } from '@games/services'
import { createJob } from '../shared/jobs'

export const processReferrerPayoutsJob = createJob({
  name: 'ProcessReferrerPayouts',
  cronTime: '0 */1 * * *', // every 1 hour
  handler: () => affiliateService.processReferrerPayouts(),
})
