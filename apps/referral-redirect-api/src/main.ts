import './setup'
import { shutdownServices } from '@core/di'
import { logger } from '@core/logger'
import { gamesRedis, maintenanceCache } from '@games/redis'
import { affiliateService } from '@games/services'
import { App, SSLApp } from 'uWebSockets.js'
import { env } from './env'

const app = env.isDev
  ? SSLApp({
      key_file_name: '../../ssl/local.key',
      cert_file_name: '../../ssl/local.crt',
    })
  : App()

/**
 * Setup
 */

app.get('/healthy', (res) => {
  res.cork(() => {
    res.writeStatus('200 OK').end('Yes')
  })
})

app.get('/ready', async (res) => {
  let replied = false

  res.onAborted(() => {
    res.writeStatus('503 Service Unavailable').end()
    replied = true
  })

  const wrapReply = (callback: () => void) => {
    if (replied) {
      return
    }

    res.cork(() => {
      callback()
      replied = true
    })
  }

  const redisReady = await gamesRedis
    .ping()
    .then(() => true)
    .catch(() => false)

  if (!redisReady) {
    wrapReply(() => {
      res.writeStatus('503 Service Unavailable').end()
    })

    return
  }

  const maintenanceMode = await maintenanceCache.isMaintenanceMode()

  if (maintenanceMode) {
    wrapReply(() => {
      res.writeStatus('503 Service Unavailable').end()
    })

    return
  }

  wrapReply(() => {
    res.writeStatus('200 OK').end('Yes')
  })
})

app.get('/r/:code', async (res, req) => {
  let replied = false

  res.onAborted(() => {
    res.writeStatus('503 Service Unavailable').end()
    replied = true
  })

  const wrapReply = (callback: () => void) => {
    if (replied) {
      return
    }

    res.cork(() => {
      callback()
      replied = true
    })
  }

  const code = req.getParameter(0)

  if (!code) {
    wrapReply(() => {
      res.writeStatus('404 Not Found').end()
    })

    return
  }

  const campaign = await affiliateService.getCampaign(code)

  if (campaign) {
    await affiliateService.incrementCampaignVisits({ campaignId: campaign.id })
  }

  wrapReply(() => {
    res.writeStatus('302 Found')
    res.writeHeader('Location', `${env.gamesApp.url}/?r=${code}`)
    res.end()
  })
})

app.listen(5054, (token) => {
  if (!token) {
    logger.error('Failed to start Referral Redirect server')
    process.exit(1)
  }

  logger.info(
    `🚀 Referral Redirect server ready at ${env.referralRedirectApi.url}`,
  )
})

process.on('uncaughtException', (error) => {
  logger.info('Uncaught exception')
  logger.error(error)
})

process.on('unhandledRejection', (error) => {
  logger.info('Unhandled rejection')
  logger.error(error)
})

let exited = false

async function handleExit() {
  if (exited) return
  exited = true

  logger.info('Exit signal received')

  logger.info('Cleaning up..')
  await shutdownServices()

  console.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
