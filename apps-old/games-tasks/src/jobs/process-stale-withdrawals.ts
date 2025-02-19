import { paymentService } from '@games/services'
import { createJob } from '../shared/jobs'

export const processStaleWithdrawalsJob = createJob({
  name: 'ProcessStaleWithdrawals',
  cronTime: '*/10 * * * *', // every 10 minutes
  runOnInit: false,
  handler: () => paymentService.processStaleWithdrawals(),
})
