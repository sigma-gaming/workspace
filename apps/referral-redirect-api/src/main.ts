import './setup'
import { shutdownAll } from '@core/di'
import { logger } from '@core/logger'
import { DomainApp } from '@dbs/games-types-private'
import {
  affiliateService,
  domainService,
  maintenanceService,
} from '@games/services'
import { App, SSLApp } from 'uWebSockets.js'
import { env } from './env'

const app = env.isDev
  ? SSLApp({
      key_file_name: '../../ssl/local.key',
      cert_file_name: '../../ssl/local.crt',
    })
  : App()

const internalApp = App()

/**
 * Setup
 */

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

  const domain = domainService.getLatestDomain(DomainApp.GamesApp)

  if (!domain) {
    wrapReply(() => {
      res.writeStatus('503 Service Unavailable').end()
    })

    return
  }

  wrapReply(() => {
    res.writeStatus('302 Found')
    res.writeHeader('Location', `https://${domain.host}/?r=${code}`)
    res.end()
  })
})

internalApp.get('/healthy', (res) => {
  res.cork(() => {
    res.writeStatus('200 OK').end('Yes')
  })
})

internalApp.get('/ready', async (res) => {
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

  const maintenanceMode = await maintenanceService.isMaintenanceMode()

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

// Initialize lazy services
domainService.waitForInitialization()

app.listen(env.ports.public, (token) => {
  if (!token) {
    logger.error('Failed to start API')
    process.exit(1)
  }

  logger.info(`🚀 API ready at ${env.referralRedirectApi.url}`)
})

internalApp.listen(env.ports.internal, (token) => {
  if (!token) {
    logger.error('Failed to start Internal API')
    process.exit(1)
  }

  logger.info(`🚀 Internal API ready at :${env.ports.internal}$`)
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

  if (env.isDev) {
    logger.info('Shutting down services..')
    await shutdownAll()

    logger.info('Exiting..')
    process.exit(0)
  }

  setTimeout(() => {
    logger.info('Timeout, exiting..')
    process.exit(0)
  }, 5000)

  logger.info('Closing servers..')
  app.close()
  internalApp.close()
  logger.info('Servers closed')

  logger.info('Shutting down services..')
  await shutdownAll()

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
