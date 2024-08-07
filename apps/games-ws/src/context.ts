import { IncomingHttpHeaders } from 'http'
import { UserSelect } from '@dbs/games-schema'
import { ProfileDetailed, Session } from '@games/model'
import { Socket } from 'socket.io'
import { ClientToServerEvents, ServerToClientEvents } from './types'

export type Context = {
  url: URL
  headers: IncomingHttpHeaders
  socket: Socket<ClientToServerEvents, ServerToClientEvents>
  session?: {
    user: UserSelect
    profile: ProfileDetailed
    session: Session
  }
}
