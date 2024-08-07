import './setup'
import './sentry/init'
import { shutdownServices } from '@core/di'
import { EventNames, WsActionInput, WsActionOutput } from '@core/io-client'
import { logger } from '@core/logger'
import {
  gamesCaches,
  gamesPubsubs,
  gamesRedis,
  maintenanceCache,
} from '@games/redis'
import { env, profileService, sessionService } from '@games/services'
import { parse } from 'cookie'
import { Server } from 'socket.io'
import { App, SSLApp } from 'uWebSockets.js'
import { GamesDiceAction } from './actions/games/dice'
import { GamesPincodeAction } from './actions/games/pincode'
import { PingAction } from './actions/ping'
import { Context } from './context'
import { userRoom } from './shared/rooms/user'
import { ClientToServerEvents, ServerToClientEvents } from './types'
import { WsActionGenerator } from './ws-action'

const app = env.isDev
  ? SSLApp({
      key_file_name: '../../ssl/local.key',
      cert_file_name: '../../ssl/local.crt',
    })
  : App()

const io = new Server<ClientToServerEvents, ServerToClientEvents>()

io.attachApp(app)

io.on('connection', async (socket) => {
  const cookie = parse(socket.handshake.headers.cookie ?? '')
  const session = await sessionService.getSession(cookie.session)
  const user = sessionService.getUserSafe(session)

  const context: Context = {
    url: new URL(env.gamesWs.url),
    headers: socket.handshake.headers,
    socket,
  }

  if (user) {
    const profile = await profileService.getDetailedProfile(user.id)

    context.session = {
      session,
      user,
      profile,
    }

    socket.join(userRoom(user.id))
  }

  function registerAction<E extends EventNames<ClientToServerEvents>>(
    generator: WsActionGenerator<
      E,
      WsActionInput<ClientToServerEvents, E>,
      WsActionOutput<ClientToServerEvents, E>
    >,
  ) {
    const action = generator(context)
    socket.on(action.name, action.handler as any)
  }

  registerAction(PingAction)
  registerAction(GamesPincodeAction)
  registerAction(GamesDiceAction)
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
let lastBigWinSent: string | null = null

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

async function sendBigWins() {
  // Add 100ms compensation for network delays
  const next = (ms = 900) => {
    setTimeout(sendBigWins, ms)
  }

  try {
    const bigWins = await gamesCaches.bigWinHistory.get()

    const lastSentIndex = bigWins.findIndex(
      (gameRecord) => gameRecord.id === lastBigWinSent,
    )

    // Send only new records
    const newWins = bigWins.slice(0, lastSentIndex)

    if (newWins.length === 0) {
      return next()
    }

    lastBigWinSent = newWins[0].id
    sendToAll('gameHistory/bigWins', newWins)

    /*
     * ~1 win per second is enough for history table
     * So, send new records later if we got more than one new win
     * Max delay is 4000ms, so new visitors will not wait too long for the first portions
     * Add 100ms compensation for network delays
     */
    const delay = Math.min(4000, 1000 * newWins.length - 100)
    next(delay)
  } catch {
    logger.error('Failed to send big wins')
    return next()
  }
}

setTimeout(sendLastWins, 3000)
setTimeout(sendBigWins, 3000)

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
