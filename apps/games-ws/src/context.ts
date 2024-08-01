import { IncomingHttpHeaders } from 'http'
import { UserSelect } from '@dbs/games-schema'
import { ProfileDetailed, Session } from '@games/model'

export type Context = {
  user: UserSelect
  profile: ProfileDetailed
  session: Session
  headers: IncomingHttpHeaders
  url: URL
}
