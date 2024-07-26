import { UserSelect } from '@dbs/games-schema'
import { AccountProvider } from '@dbs/games-types'

export enum SessionState {
  Empty,
  Expired,
  Authenticated,
}

export type Session =
  | {
      state: SessionState.Authenticated
      user: UserSelect
      token: string
      expiresAt: string
      provider: AccountProvider
    }
  | { state: SessionState.Expired; user: null; token: string }
  | { state: SessionState.Empty; user: null; token?: string }
