import './setup'
import './shared/sentry/init'
import { shutdownServices } from '@core/di'
import { EventNames, WsActionInput, WsActionOutput } from '@core/io-client'
import { logger } from '@core/logger'
import { gamesPubsubs, gamesRedis, maintenanceCache } from '@games/redis'
import { sessionService } from '@games/services'
import { parse } from 'cookie'
import { App, SSLApp } from 'uWebSockets.js'
import { GamesDiceAction } from './actions/games/dice'
import { GamesPincodeAction } from './actions/games/pincode'
import { GlobalTasksClaimRewardAction } from './actions/global-tasks/claim-reward'
import { GlobalTasksCompleteAction } from './actions/global-tasks/complete'
import { PingAction } from './actions/ping'
import { Context } from './context'
import { env } from './env'
import { io } from './io'
import { startLastWinsBroadcast } from './processes/last-wins'
import { sendToAllLocal, sendToUser } from './shared/send'
import { ClientToServerEvents } from './types'
import { WsActionGenerator } from './ws-action'

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

  const context: Context = {
    url: new URL(env.gamesWs.url),
    headers: socket.handshake.headers,
    socket,
    session,
  }

  /**
   * Actions
   */

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
  registerAction(GlobalTasksCompleteAction)
  registerAction(GlobalTasksClaimRewardAction)
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
