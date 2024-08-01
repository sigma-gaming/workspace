import { UserSelect } from '@dbs/games-schema'
import { Session } from '@games/model'

export type Context = {
  user: UserSelect
  session: Session
}
