import { Hono } from 'hono'
import { connectRoute } from './connect'
import { getBalanceRoute } from './get-balance'
import { getCampaingsRoute } from './get-campaigns'
import { getLastTransactionsRoute } from './get-last-transactions'
import { getSettingsRoute } from './get-settings'
import { isConnectedRoute } from './is-connected'
import { withdrawRoute } from './withdraw'

export const affiliateRouter = new Hono()
  .route('/connect', connectRoute)
  .route('/withdraw', withdrawRoute)
  .route('/isConnected', isConnectedRoute)
  .route('/getBalance', getBalanceRoute)
  .route('/getSettings', getSettingsRoute)
  .route('/getCampaigns', getCampaingsRoute)
  .route('/getLastTransactions', getLastTransactionsRoute)
