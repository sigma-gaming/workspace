import { User } from '@libs/games-db-schema'

export enum SessionState {
  Empty,
  Expired,
  Authenticated,
}

export type Session =
  | { state: SessionState.Authenticated; user: User; token: string }
  | { state: SessionState.Expired; user: null; token: string }
  | { state: SessionState.Empty; user: null; token?: string }
