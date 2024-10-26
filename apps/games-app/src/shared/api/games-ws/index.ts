import { ClientToServerEvents, ServerToClientEvents } from '@apis/games-ws'
import { createEvent, createStore } from 'effector'
import { io, Socket } from 'socket.io-client'
import { env } from '../../env'

export const gamesWs: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  env.gamesWs.url,
  { transports: ['websocket', 'polling', 'webtransport'] },
)

const connected = createEvent()
const disconnected = createEvent()

const $connected = createStore(false)
  .on(connected, () => true)
  .on(disconnected, () => false)

gamesWs.on('connect', () => connected())
gamesWs.on('disconnect', () => disconnected())

export const $$gamesWs = {
  $connected,
}
