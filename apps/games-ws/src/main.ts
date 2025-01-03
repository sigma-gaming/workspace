import './setup'
import './shared/sentry/init'
import { shutdownAll } from '@core/di'
import {
  SocketRejectionReason,
  TooManyConnectionsException,
} from '@core/exceptions'
import { logger } from '@core/logger'
import { UpdateMode } from '@games/model'
import {
  gamesPubsubs,
  maintenanceService,
  sessionService,
} from '@games/services'
import { parse } from 'cookie'
import { Socket } from 'socket.io'
import { App, SSLApp } from 'uWebSockets.js'
import { env } from './env'
import { io } from './io'
import { EmitScope, metrics, registry, UserType } from './metrics'
import { startLastWinsBroadcast } from './processes/last-wins'
import { ipRoom, userRoom } from './shared/rooms'
import { getRoomConnections } from './shared/rooms/get-connections'
import { sendToAllLocal, sendToUser, sendToUserOptimized } from './shared/send'

const app = env.isDev
  ? SSLApp({
      key_file_name: '../../ssl/local.key',
      cert_file_name: '../../ssl/local.crt',
    })
  : App()

io.attachApp(app)

function getUserIp(socket: Socket) {
  const cfIp = socket.handshake.headers['cf-connecting-ip']
  if (cfIp) return String(cfIp)
  const forwardedFor = socket.handshake.headers['x-forwarded-for']
  if (forwardedFor) {
    const first = String(forwardedFor).split(',', 1)[0]?.trim()
    if (first) return first
  }
  return socket.handshake.address
}

function saveUserIp(socket: Socket) {
  const userIp = getUserIp(socket)
  socket.data.userIp = userIp
}

function getSavedUserIp(socket: Socket): string | null {
  return socket.data.userIp ?? null
}

let currentConnections = 0

function calculateMaxConnectionsPerIp() {
  if (currentConnections > 5000) return 1
  if (currentConnections > 1000) return 3
  if (currentConnections > 250) return 10
  return 30
}

io.use((socket, next) => {
  if (env.rateLimit.bypassToken) {
    const bypassToken = socket.handshake.headers['x-bypass-rate-limit']

    if (bypassToken === env.rateLimit.bypassToken) {
      return next()
    }
  }

  const userIp = getUserIp(socket)
  const ipConnections = getRoomConnections(ipRoom(userIp))

  if (ipConnections >= calculateMaxConnectionsPerIp()) {
    metrics.rejectedTotalCounter.inc({
      user_type: UserType.Unknown,
      reason: SocketRejectionReason.TooManyConnections,
    })

    return next(new TooManyConnectionsException())
  }

  saveUserIp(socket)
  next()
})

io.on('connection', async (socket) => {
  const cookie = parse(socket.handshake.headers.cookie ?? '')
  const { session } = await sessionService.getSessionSafe(cookie.session_id)

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const user_type = session ? UserType.Authenticated : UserType.Guest

  const userIp = getSavedUserIp(socket)

  if (!userIp) {
    logger.error('No saved user IP found')
    return socket.disconnect()
  }

  /**
   * Determine the main room for tracking the user online
   */
  const mainRoom = session ? userRoom(session.userId) : ipRoom(userIp)

  /**
   * Join both IP and user rooms for rate-limiting and tracking the user online
   */
  socket.join(ipRoom(userIp))
  if (session) socket.join(userRoom(session.userId))

  currentConnections += 1
  metrics.connectedTotalCounter.inc({ user_type })
  metrics.connectionsGauge.inc({ user_type })

  if (getRoomConnections(mainRoom) === 1) {
    metrics.onlineUsersGauge.inc({ user_type })
  }

  socket.on('disconnect', () => {
    currentConnections -= 1
    metrics.connectionsGauge.dec({ user_type })
    metrics.disconnectedTotalCounter.inc({ user_type })

    if (getRoomConnections(mainRoom) === 0) {
      metrics.onlineUsersGauge.dec({ user_type })
    }
  })

  socket.on('error', (error) => {
    metrics.errorsTotalCounter.inc({ user_type })
    logger.error(error, 'Error in socket')
  })

  const originalEmit = socket.emit

  socket.emit = (event, ...args) => {
    metrics.eventsSentTotalCounter.inc({
      user_type,
      emit_scope: EmitScope.Socket,
    })

    logger.info(`Emit ${event} (socket)`)

    return originalEmit(event, ...args)
  }

  socket.onAny(() => {
    metrics.eventsReceivedTotalCounter.inc({ user_type })
  })
})

const ioOriginalEmit = io.emit

io.emit = (event, ...args) => {
  metrics.eventsSentTotalCounter.inc({
    user_type: UserType.Unknown,
    emit_scope: EmitScope.Global,
  })

  logger.info(`Emit ${event} (global)`)

  return ioOriginalEmit(event, ...args)
}

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

internalApp.get('/metrics', async (res) => {
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

  try {
    // Получаем метрики из prom-client
    const metrics = await registry.metrics()

    wrapReply(() => {
      res.writeHeader('Content-Type', registry.contentType).end(metrics)
    })
  } catch (error) {
    logger.error('Error generating metrics:', error)

    wrapReply(() => {
      res
        .writeStatus('500 Internal Server Error')
        .end('Failed to generate metrics')
    })
  }
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
