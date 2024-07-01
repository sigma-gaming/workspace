import './setup'
import { shutdownServices } from '@core/di'
import { logger } from '@core/logger'
import { gamesPubsubs } from '@games/redis'
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

  socket.on('disconnect', () => {
    socket.leave(userRoom(user.id))
  })
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

/**
 * Setup
 */

app.get('/health', (res) => {
  res.writeStatus('200 OK').end('Healthy')
})

app.get('/ready', (res) => {
  res.writeStatus('200 OK').end('Healthy')
})

app.listen(5052, (token) => {
  if (!token) {
    logger.error('Failed to start WebSocket server')
    process.exit(1)
  }

  logger.info(`🚀 WebSocket server ready at ${env.gamesWs.url}`)
})

let exited = false

async function handleExit() {
  if (exited) return
  exited = true

  logger.info('Exit signal received')

  logger.info('Closing WebSocket server server..')
  app.close()

  logger.info('Cleaning up..')
  await shutdownServices()

  console.info('Exiting..')
  process.exit(0)
}

process.on('SIGTERM', handleExit)
process.on('SIGINT', handleExit)
