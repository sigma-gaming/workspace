import { gamesPubsubs } from '@games/services'
import { createAdapter } from '@socket.io/redis-adapter'
import { Server } from 'socket.io'
import { env } from './env'
import { ClientToServerEvents, ServerToClientEvents } from './types'

const allowedOrigins = [env.gamesApp.url]

export const io = new Server<ClientToServerEvents, ServerToClientEvents>({
  adapter: createAdapter(gamesPubsubs.pub, gamesPubsubs.sub),
  allowRequest(req, callback) {
    const isCorrectOrigin = allowedOrigins.includes(req.headers.origin ?? '')
    if (isCorrectOrigin) callback(null, true)
    else callback('Origin not allowed', false)
  },
})
