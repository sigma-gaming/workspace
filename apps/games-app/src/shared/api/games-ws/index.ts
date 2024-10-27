import { ClientToServerEvents, ServerToClientEvents } from '@apis/games-ws'
import { createEffect, createEvent, createStore, sample } from 'effector'
import { io, Socket } from 'socket.io-client'
import { env } from '../../env'

export const gamesWs: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  env.gamesWs.url,
  {
    transports: ['websocket', 'polling', 'webtransport'],
    withCredentials: true,
  },
)

const connectFx = createEffect(() => gamesWs.connect())
const disconnectFx = createEffect(() => gamesWs.disconnect())

const reconnectFx = createEffect(() => {
  disconnectFx()
  connectFx()
})

const connect = createEvent()
const disconnect = createEvent()
const reconnect = createEvent()

const connected = createEvent()
const disconnected = createEvent()

sample({ source: connect, target: connectFx })
sample({ source: disconnect, target: disconnectFx })
sample({ source: reconnect, target: reconnectFx })

const $connected = createStore(false)
  .on(connected, () => true)
  .on(disconnected, () => false)

gamesWs.on('connect', () => connected())
gamesWs.on('disconnect', () => disconnected())

export const $$gamesWs = {
  connect,
  disconnect,
  reconnect,
  $connected,
}
