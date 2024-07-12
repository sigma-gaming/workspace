import './setup'
import { shutdownServices } from '@core/di'
import { logger } from '@core/logger'
import {
  gamesCaches,
  gamesPubsubs,
  gamesRedis,
  maintenanceCache,
} from '@games/redis'
import { env, sessionService } from '@games/services'
import { parse } from 'cookie'
import { Server } from 'socket.io'
import { App, SSLApp } from 'uWebSockets.js'
import { ClientToServerEvents, ServerToClientEvents } from './types'

const app = env.isDev
  ? SSLApp({
      key_file_name: '../../ssl/local.key',
      cert_file_name: '../../ssl/local.crt',
    })
  : App()

const io = new Server<ClientToServerEvents, ServerToClientEvents>()

io.attachApp(app)

const userRoom = (userId: string) => `user:${userId}`

io.on('connection', async (socket) => {
  const cookie = parse(socket.handshake.headers.cookie ?? '')
  const session = await sessionService.getSession(cookie.session)
  const user = sessionService.getUserSafe(session)

  if (!user) {
    socket.disconnect()
    return
  }

  socket.join(userRoom(user.id))
})

/**
 * Business logic
 */

function sendToUser<K extends keyof ServerToClientEvents>(
  userId: string,
  event: K,
  ...payload: Parameters<ServerToClientEvents[K]>
) {
  io.to(userRoom(userId)).emit(event, ...payload)
}

function sendToAll<K extends keyof ServerToClientEvents>(
  event: K,
  ...payload: Parameters<ServerToClientEvents[K]>
) {
  io.emit(event, ...payload)
}

gamesPubsubs.chatMessages.subscribe((payload) => {
  sendToAll('chat/message', payload)
})

gamesPubsubs.notifications.subscribe((payload) => {
  if (payload.userId) {
    sendToUser(payload.userId, 'notification', payload)
  } else {
    sendToAll('notification', payload)
  }
})

gamesPubsubs.maintenanceStarted.subscribe(() => {
  sendToAll('maintenance/started')
})

let lastWinSent: string | null = null

async function sendLastWins() {
  // Add 100ms compensation for network delays
  const next = (ms = 900) => {
    setTimeout(sendLastWins, ms)
  }

  try {
    const lastWins = await gamesCaches.lastWinHistory.get()

    const lastSentIndex = lastWins.findIndex(
      (gameRecord) => gameRecord.id === lastWinSent,
    )

    // Send only new records
    const newWins = lastWins.slice(0, lastSentIndex)

    if (newWins.length === 0) {
      return next()
    }

    lastWinSent = newWins[0].id
    sendToAll('gameHistory/lastWins', newWins)

    /*
     * ~1 win per second is enough for history table
     * So, send new records later if we got more than one new win
     * Max delay is 4000ms, so new visitors will not wait too long for the first portions
     * Add 100ms compensation for network delays
     */
    const delay = Math.min(4000, 1000 * newWins.length - 100)
    next(delay)
  } catch {
    logger.error('Failed to send last wins')
    return next()
  }
}

setTimeout(sendLastWins, 3000)

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

app.listen(5052, (token) => {
  if (!token) {
    logger.error('Failed to start WebSocket server')
    process.exit(1)
  }

  logger.info(`🚀 WebSocket server ready at ${env.gamesWs.url}`)
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

  logger.info('Closing WebSocket server server..')
  io.close(() => app.close())

  logger.info('Cleaning up..')
  await shutdownServices()

  console.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
