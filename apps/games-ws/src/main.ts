import './setup'
import './shared/sentry/init'
import { shutdownAll } from '@core/di'
import { logger } from '@core/logger'
import { UpdateMode } from '@games/model'
import {
  gamesPubsubs,
  maintenanceService,
  sessionService,
} from '@games/services'
import { parse } from 'cookie'
import { App, SSLApp } from 'uWebSockets.js'
import { env } from './env'
import { io } from './io'
import { startLastWinsBroadcast } from './processes/last-wins'
import { userRoom } from './shared/rooms/user'
import { sendToAllLocal, sendToUser, sendToUserOptimized } from './shared/send'

const app = env.isDev
  ? SSLApp({
      key_file_name: '../../ssl/local.key',
      cert_file_name: '../../ssl/local.crt',
    })
  : App()

io.attachApp(app)

io.on('connection', async (socket) => {
  const cookie = parse(socket.handshake.headers.cookie ?? '')
  const { session } = await sessionService.getSessionSafe(cookie.session_id)

  if (session) {
    socket.join(userRoom(session.userId))
  }
})

/**
 * Business logic
 */

startLastWinsBroadcast()

gamesPubsubs.chatMessages.subscribe((payload) => {
  sendToAllLocal('chat/message', payload)
})

gamesPubsubs.notifications.subscribe((payload) => {
  if (payload.userId) {
    sendToUser(payload.userId, 'notification', payload)
  } else {
    sendToAllLocal('notification', payload)
  }
})

gamesPubsubs.maintenanceStarted.subscribe(() => {
  sendToAllLocal('maintenance/started')
})

gamesPubsubs.balanceUpdated.subscribe(({ userId, update }) => {
  if (update.mode === UpdateMode.Optimized) {
    sendToUserOptimized(userId, 'balance/updated', update)
    return
  }

  sendToUser(userId, 'balance/updated', update)
})

gamesPubsubs.globalTaskUpdated.subscribe(({ userId, update }) => {
  if (update.mode === UpdateMode.Optimized) {
    sendToUserOptimized(userId, 'global-tasks/updated', update)
    return
  }

  sendToUser(userId, 'global-tasks/updated', update)
})

/**
 * Internal API
 */

const internalApp = App()

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

app.listen(env.ports.public, (token) => {
  if (!token) {
    logger.error('Failed to start WebSocket server')
    process.exit(1)
  }

  logger.info(`🚀 WebSocket server ready at ${env.gamesWs.url}`)
})

internalApp.listen(env.ports.internal, (token) => {
  if (!token) {
    logger.error('Failed to start Internal API')
    process.exit(1)
  }

  logger.info(`🚀 Internal API ready at :${env.ports.internal}`)
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
  io.close(() => app.close())
  internalApp.close()
  logger.info('Servers closed')

  logger.info('Shutting down services..')
  await shutdownAll()

  logger.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
