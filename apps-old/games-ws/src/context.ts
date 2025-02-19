import { IncomingHttpHeaders } from 'http'
import { SessionSelect } from '@dbs/games-schema'
import { Socket } from 'socket.io'
import { ClientToServerEvents, ServerToClientEvents } from './types'

export type Context = {
  url: URL
  headers: IncomingHttpHeaders
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
  session: SessionSelect | null
}
