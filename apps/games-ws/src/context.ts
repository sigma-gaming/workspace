import { IncomingHttpHeaders } from 'http'
import { Session } from '@games/model'
import { Socket } from 'socket.io'
import { ClientToServerEvents, ServerToClientEvents } from './types'

export type Context = {
  url: URL
  headers: IncomingHttpHeaders
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
  session: Session | null
}
