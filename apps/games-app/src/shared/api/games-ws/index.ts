import { ClientToServerEvents, ServerToClientEvents } from '@apis/games-ws'
import { io, Socket } from 'socket.io-client'
import { env } from '../../env'

export const gamesWs: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  env.gamesWs.url,
  {
    transports: ['websocket', 'polling', 'webtransport'],
    withCredentials: true,
  },
)
