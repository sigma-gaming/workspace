import { paymentService } from '@games/services'
import { createJob } from '../shared/jobs'

export const processStaleDepositsJob = createJob({
  name: 'ProcessStaleDeposits',
  cronTime: '*/10 * * * *', // every 10 minutes
  runOnInit: false,
  handler: () => paymentService.processStaleDeposits(),
})
