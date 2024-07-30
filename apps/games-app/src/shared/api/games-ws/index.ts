import { ServerToClientEvents } from '@apis/games-ws'
import { io, Socket } from 'socket.io-client'
import { env } from '../../env'

export const gamesWs: Socket<ServerToClientEvents> = io(env.gamesWs.url, {
  transports: ['websocket', 'polling', 'webtransport'],
  withCredentials: true,
})
